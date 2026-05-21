import _ from "lodash";
import { getId, Id } from "../../domain/common/entities/Base";
import { CompulsoryDataValue } from "../../domain/common/entities/CompulsoryDataValue";
import { DataElement } from "../../domain/common/entities/DataElement";
import {
    DataValue,
    DataValueFile,
    DataValueTextMultiple,
    DateObj,
    FileResource,
    MULTI_TEXT_SEPARATOR,
    Period,
} from "../../domain/common/entities/DataValue";
import { DataValueRepository, DataElementRefType } from "../../domain/common/repositories/DataValueRepository";
import { D2Api, DataValueSetsDataValue } from "../../types/d2-api";
import { promiseMap } from "../../utils/promises";
import { replaceInvalidXmlChars } from "../../utils/string";
import { assertUnreachable, Maybe } from "../../utils/ts-utils";
import { Dhis2DataElement } from "./Dhis2DataElement";

export class Dhis2DataValueRepository implements DataValueRepository {
    constructor(private api: D2Api) {}

    async get(options: { dataSetId: Id; orgUnits: Id[]; periods: Period[] }): Promise<DataValue[]> {
        const { dataValues } = await this.api.dataValues
            .getSet({
                dataSet: [options.dataSetId],
                orgUnit: options.orgUnits,
                period: options.periods,
            })
            .getData();

        const dataSetResponse = await this.api.models.dataSets
            .get({
                fields: { id: true, code: true },
                filter: { id: { eq: options.dataSetId } },
            })
            .getData();

        const dataSetCode = dataSetResponse.objects[0]?.code;
        if (!dataSetCode) throw new Error(`Data set not found: ${options.dataSetId}`);

        const compulsoryDataElements = await this.getCompulsoryDataElements(options.dataSetId);

        const deIdsFromPayload = _.uniq(_.map(dataValues, dv => dv.dataElement));
        const deIdsRequired = _.uniq(_.map(compulsoryDataElements, r => r.dataElementId));
        const allDataElementIds = _(deIdsFromPayload).concat(deIdsRequired).uniq().value();

        const dataElements = await this.getDataElements(dataValues, dataSetCode, allDataElementIds);

        const dataValuesFiles = await this.getFileResourcesMapping(dataElements, dataValues);

        const isEmptyStr = (s?: string | null): boolean => !s || s.trim() === "";

        const isRequiredCombo = (deId: Id, cocId: Id): boolean =>
            _.some(compulsoryDataElements, req => req.dataElementId === deId && req.categoryOptionComboId === cocId);

        const dataValuesByType = _(dataValues)
            .map((dv): DataValue | null => {
                const dataElement = dataElements[dv.dataElement];
                if (!dataElement) {
                    console.error(`Data element not found: ${dv.dataElement}`);
                    return null;
                }

                const isRequired = isRequiredCombo(dv.dataElement, dv.categoryOptionCombo) && isEmptyStr(dv.value);

                const selector = {
                    orgUnitId: dv.orgUnit,
                    period: dv.period,
                    categoryOptionComboId: dv.categoryOptionCombo,
                    isRequired,
                    comment: dv.comment || "",
                };

                const { type } = dataElement;

                const isMultiTextType = dataElement.type === "MULTI_TEXT";
                const isMultiple = dataElement.options?.isMultiple || isMultiTextType;

                switch (type) {
                    case "TEXT":
                        return isMultiple
                            ? { type: "TEXT", isMultiple: true, dataElement, values: getValues(dv.value), ...selector }
                            : {
                                  type: "TEXT",
                                  isMultiple: false,
                                  dataElement,
                                  value: dv.value,
                                  ...selector,
                              };
                    case "MULTI_TEXT":
                        return {
                            type: "MULTI_TEXT",
                            isMultiple: true,
                            dataElement,
                            values: getValues(dv.value, MULTI_TEXT_SEPARATOR),
                            ...selector,
                        };
                    case "NUMBER":
                        return isMultiple
                            ? {
                                  type: "NUMBER",
                                  isMultiple: true,
                                  dataElement,
                                  values: getValues(dv.value),
                                  ...selector,
                              }
                            : {
                                  type: "NUMBER",
                                  isMultiple: false,
                                  dataElement,
                                  value: dv.value,
                                  ...selector,
                              };
                    case "PERCENTAGE":
                        return {
                            type: "PERCENTAGE",
                            isMultiple: false,
                            dataElement,
                            value: dv.value,
                            ...selector,
                        };
                    case "BOOLEAN":
                        return {
                            type: "BOOLEAN",
                            isMultiple: false,
                            dataElement,
                            value: dv.value === "true",
                            ...selector,
                        };
                    case "FILE":
                        return {
                            type: "FILE",
                            dataElement,
                            file: dataValuesFiles[dv.value],
                            isMultiple: false,
                            ...selector,
                        };
                    case "DATE": {
                        const [year, month, day] = (dv.value || "").split("-").map(s => parseInt(s));
                        const value: Maybe<DateObj> = year && month && day ? { year, month, day } : undefined;

                        return {
                            type: "DATE",
                            dataElement,
                            value: value,
                            isMultiple: false,
                            ...selector,
                        };
                    }
                    default:
                        assertUnreachable(type);
                }
            })
            .compact()
            .value();

        return this.checkCompulsoryAndBuildDataValues({
            compulsoryDataValues: compulsoryDataElements,
            orgUnitIds: options.orgUnits,
            periods: options.periods,
            dataValues: dataValuesByType,
            dataElements: dataElements,
        });
    }

    private checkCompulsoryAndBuildDataValues(options: {
        compulsoryDataValues: CompulsoryDataValue[];
        orgUnitIds: Id[];
        periods: Period[];
        dataValues: DataValue[];
        dataElements: Record<Id, DataElement>;
    }): DataValue[] {
        const { dataElements, compulsoryDataValues, orgUnitIds, periods, dataValues } = options;

        const allCombos = _.flatMap(orgUnitIds, orgUnitId =>
            _.flatMap(periods, period =>
                _.map(compulsoryDataValues, req => ({
                    dataElementId: req.dataElementId,
                    categoryOptionComboId: req.categoryOptionComboId,
                    orgUnitId,
                    period,
                }))
            )
        );

        const existingKeys = new Set(
            _.map(dataValues, dv => `${dv.dataElement.id}|${dv.categoryOptionComboId}|${dv.orgUnitId}|${dv.period}`)
        );

        const missingCombos = _.filter(allCombos, combo => {
            const key = `${combo.dataElementId}|${combo.categoryOptionComboId}|${combo.orgUnitId}|${combo.period}`;
            return !existingKeys.has(key);
        });

        const missingRequired = _(missingCombos)
            .map((combo): Maybe<DataValue> => {
                const dataElement = dataElements[combo.dataElementId];
                if (!dataElement) return undefined;

                const isMultiple = Boolean(dataElement.options?.isMultiple) || dataElement.type === "MULTI_TEXT";
                const selector = {
                    orgUnitId: combo.orgUnitId,
                    period: combo.period,
                    categoryOptionComboId: combo.categoryOptionComboId,
                    isRequired: true,
                    comment: "",
                };

                const { type } = dataElement;

                switch (type) {
                    case "TEXT":
                        return isMultiple
                            ? { type: "TEXT", isMultiple: true, dataElement: dataElement, values: [], ...selector }
                            : { type: "TEXT", isMultiple: false, dataElement: dataElement, value: "", ...selector };
                    case "MULTI_TEXT":
                        return {
                            type: "MULTI_TEXT",
                            isMultiple: true,
                            dataElement: dataElement,
                            values: [],
                            ...selector,
                        };
                    case "NUMBER":
                        return isMultiple
                            ? { type: "NUMBER", isMultiple: true, dataElement: dataElement, values: [], ...selector }
                            : {
                                  type: "NUMBER",
                                  isMultiple: false,
                                  dataElement: dataElement,
                                  value: "",
                                  ...selector,
                              };
                    case "PERCENTAGE":
                        return {
                            type: "PERCENTAGE",
                            isMultiple: false,
                            dataElement: dataElement,
                            value: "",
                            ...selector,
                        };
                    case "BOOLEAN":
                        return {
                            type: "BOOLEAN",
                            isMultiple: false,
                            dataElement: dataElement,
                            value: undefined,
                            ...selector,
                        };
                    case "FILE":
                        return {
                            type: "FILE",
                            dataElement: dataElement,
                            file: undefined,
                            isMultiple: false,
                            ...selector,
                        };
                    case "DATE":
                        return {
                            type: "DATE",
                            dataElement: dataElement,
                            value: undefined,
                            isMultiple: false,
                            ...selector,
                        };
                    default:
                        assertUnreachable(type);
                }
            })
            .compact()
            .value();

        return dataValues.concat(missingRequired);
    }

    private async getCompulsoryDataElements(dataSetId: Id): Promise<CompulsoryDataValue[]> {
        return this.api.models.dataSets
            .get({
                fields: {
                    compulsoryDataElementOperands: { dataElement: { id: true }, categoryOptionCombo: { id: true } },
                },
                filter: { id: { eq: dataSetId } },
            })
            .getData()
            .then(response => {
                const first = response.objects[0];
                if (!first) throw new Error(`Data set not found: ${dataSetId}`);

                return first.compulsoryDataElementOperands.map(
                    cdeo => new CompulsoryDataValue(cdeo.dataElement.id, cdeo.categoryOptionCombo.id)
                );
            });
    }

    private async getFileResourcesMapping(
        dataElements: Record<Id, DataElement>,
        dataValues: DataValueSetsDataValue[]
    ): Promise<Record<Id, FileResource>> {
        const fileResources = await promiseMap(dataValues, async dataValue => {
            const dataElement = dataElements[dataValue.dataElement];
            if (dataElement?.type !== "FILE") return undefined;

            return this.api
                .get<D2FileResource>(`/fileResources/${dataValue.value}`)
                .getData()
                .then(
                    (fileResource): FileResource => ({
                        id: fileResource.id,
                        name: fileResource.displayName,
                        size: fileResource.contentLength,
                        url: this.getUrl({
                            dataElementId: dataElement.id,
                            categoryOptionComboId: dataValue.categoryOptionCombo,
                            orgUnitId: dataValue.orgUnit,
                            period: dataValue.period,
                        }),
                    })
                )
                .catch(() => undefined);
        });

        return _(fileResources).compact().keyBy(getId).value();
    }

    private getUrl(options: { dataElementId: Id; categoryOptionComboId: Id; orgUnitId: Id; period: Period }): string {
        return (
            `${this.api.baseUrl}/api/dataValues/files?` +
            new URLSearchParams({
                de: options.dataElementId,
                co: options.categoryOptionComboId,
                ou: options.orgUnitId,
                pe: options.period,
            }).toString()
        );
    }

    private async getDataElements(dataValues: DataValueSetsDataValue[], dataSetCode: string, allDataElementIds: Id[]) {
        const dataElementIds = dataValues.map(dv => dv.dataElement);
        const uniqDataElementIds = _(dataElementIds).concat(allDataElementIds).uniq().value();
        return new Dhis2DataElement(this.api).get(uniqDataElementIds, dataSetCode);
    }

    async save(dataValue: DataValue): Promise<DataValue> {
        const valueStr = this.getStrValue(dataValue);
        const { type } = dataValue;

        switch (type) {
            case "FILE": {
                const { fileToSave } = dataValue;

                if (fileToSave) {
                    return this.saveFileDataValue(dataValue, fileToSave);
                } else {
                    return this.deleteFileDataValue(dataValue);
                }
            }
            default:
                return this.api.dataValues
                    .post({
                        ou: dataValue.orgUnitId,
                        pe: dataValue.period,
                        de: dataValue.dataElement.id,
                        co: dataValue.dataElement.cocId || dataValue.categoryOptionComboId,
                        value: valueStr,
                    })
                    .getData()
                    .then(() => dataValue);
        }
    }

    async delete(dataValues: DataValue[]): Promise<void> {
        const dataValuesToDelete = dataValues.map(dataValue => ({
            dataElement: dataValue.dataElement.id,
            categoryOptionCombo: dataValue.dataElement.cocId || dataValue.categoryOptionComboId,
            period: dataValue.period,
            orgUnit: dataValue.orgUnitId,
            value: this.getStrValue(dataValue),
        }));

        await this.api.dataValues.postSet({ importStrategy: "DELETE" }, { dataValues: dataValuesToDelete }).getData();
    }

    async applyToAll(
        dataValue: DataValueTextMultiple,
        sourceTypeDeList: DataElementRefType[]
    ): Promise<"SUCCESS" | "ERROR" | "WARNING" | "OK"> {
        const valueStr = this.getStrValue(dataValue);

        const stDataValues = sourceTypeDeList.map(de => {
            return {
                dataElement: de.id,
                value: valueStr,
                orgUnit: dataValue.orgUnitId,
                period: dataValue.period,
                categoryOptionCombo: dataValue.dataElement.cocId || dataValue.categoryOptionComboId,
            };
        });

        const stDataPost = {
            period: dataValue.period,
            orgUnit: dataValue.orgUnitId,
            dataValues: stDataValues,
        };

        return this.api.dataValues
            .postSetAsync({}, stDataPost)
            .getData()
            .then(response => response.status);
    }

    private async deleteFileDataValue(dataValue: DataValueFile): Promise<DataValue> {
        await this.api
            .request<unknown>({
                method: "delete",
                url: "/dataValues",
                params: {
                    ou: dataValue.orgUnitId,
                    pe: dataValue.period,
                    de: dataValue.dataElement.id,
                },
            })
            .getData();

        return { ...dataValue, file: undefined, fileToSave: undefined };
    }

    private async saveFileDataValue(dataValue: DataValueFile, fileToSave: File): Promise<DataValueFile> {
        const obj = {
            ou: dataValue.orgUnitId,
            pe: dataValue.period,
            de: dataValue.dataElement.id,
            file: fileToSave,
        };

        const formData = new FormData();
        _.forEach(obj, (value, key) => formData.append(key, value));

        const res = await this.api
            .request<D2PostFileResource>({
                method: "post",
                url: "/dataValues/file",
                data: formData,
                requestBodyType: "raw",
            })
            .getData();

        const resource = res.response.fileResource;
        const fileResource: FileResource = {
            id: resource.id,
            name: resource.displayName,
            size: resource.contentLength,
            url: this.getUrl({
                dataElementId: dataValue.dataElement.id,
                categoryOptionComboId: dataValue.categoryOptionComboId,
                orgUnitId: dataValue.orgUnitId,
                period: dataValue.period,
            }),
        };

        return { ...dataValue, file: fileResource, fileToSave: undefined };
    }

    private getStrValue(dataValue: DataValue): string {
        switch (dataValue.type) {
            case "BOOLEAN":
                return dataValue.value
                    ? "true"
                    : dataValue.value === false && !dataValue.dataElement.isTrueOnly
                    ? "false"
                    : "";
            case "NUMBER":
                return (dataValue.isMultiple ? dataValue.values.join("; ") : dataValue.value) || "";
            case "TEXT":
                return replaceInvalidXmlChars(
                    (dataValue.isMultiple ? dataValue.values.join("; ") : dataValue.value) || ""
                );
            case "MULTI_TEXT":
                return dataValue.values.map(value => replaceInvalidXmlChars(value)).join(MULTI_TEXT_SEPARATOR);
            case "FILE":
                return dataValue.file?.id || "";
            case "PERCENTAGE":
                return dataValue.value || "";
            case "DATE": {
                const val = dataValue.value;
                return val ? [val.year, pad2(val.month), pad2(val.day)].join("-") : "";
            }
        }
    }
}

function pad2(n: number): string {
    return n.toString().padStart(2, "0");
}

function getValues(s: string, splitSeparator = ";"): string[] {
    return _(s)
        .split(splitSeparator)
        .map(s => s.trim())
        .compact()
        .value();
}

interface D2FileResource {
    id: Id;
    displayName: string;
    contentLength: number;
}

interface D2PostFileResource {
    response: { fileResource: D2FileResource };
}
