import _ from "lodash";
import { getId, Id } from "../../domain/common/entities/Base";
import { DataElement } from "../../domain/common/entities/DataElement";
import { DataForm, defaultTexts, Section, SectionBase } from "../../domain/common/entities/DataForm";
import { Period } from "../../domain/common/entities/DataValue";
import { SectionStyle } from "../../domain/common/entities/SectionStyle";
import { DataFormRepository } from "../../domain/common/repositories/DataFormRepository";
import { D2Api, MetadataPick } from "../../types/d2-api";
import { Dhis2DataElement } from "./Dhis2DataElement";
import { Dhis2DataStoreDataForm, SectionConfig, SubNational } from "./Dhis2DataStoreDataForm";

export class Dhis2DataFormRepository implements DataFormRepository {
    constructor(private api: D2Api) {}

    async get(options: { id: Id; period: Period; orgUnitId: Id }): Promise<DataForm> {
        const metadata = await this.getMetadata(options);
        const dataSet = metadata.dataSets[0];
        if (!dataSet) return Promise.reject(new Error("Data set not found"));
        const config = await Dhis2DataStoreDataForm.build(this.api, dataSet.code);
        const sections = await this.getSections(dataSet, config, options.period, options.orgUnitId);
        const dataElements = _.flatMap(sections, section => section.dataElements);
        const dataElementsOptions = this.getDataElementsOptions(dataElements, config);
        const dataSetConfig = config.getDataSetConfig(dataSet, options.period);

        return {
            id: dataSet.id,
            expiryDays: dataSet.expiryDays,
            dataInputPeriods: dataSet.dataInputPeriods,
            dataElements: _.flatMap(sections, section => section.dataElements),
            sections: sections,
            texts: dataSetConfig.texts,
            options: {
                dataElements: dataElementsOptions,
            },
        };
    }

    private getDataElementsOptions(dataElements: DataElement[], config: Dhis2DataStoreDataForm) {
        const dataElementsByCode = _.keyBy(dataElements, de => de.code);
        const dataElementsOptions = _(config.dataElementsConfig)
            .toPairs()
            .map(([code, deConfig]) => {
                const dataElement = dataElementsByCode[code];
                if (!dataElement) return;
                const defaultWidget = dataElement.type === "BOOLEAN" ? "radio" : "dropdown";
                const value = { widget: deConfig.selection?.widget || defaultWidget };
                return [dataElement.id, value] as [typeof dataElement.id, typeof value];
            })
            .compact()
            .fromPairs()
            .value();
        return dataElementsOptions;
    }

    private async getMetadata(options: { id: Id }) {
        const metadataQuery = getMetadataQuery({ dataSetId: options.id });
        return this.api.metadata.get(metadataQuery).getData();
    }

    private async getSections(dataSet: D2DataSet, configDataForm: Dhis2DataStoreDataForm, period: Period, orgUnit: Id) {
        const dataSetConfig = configDataForm.getDataSetConfig(dataSet, period);
        const dataElementIds = _(dataSet.sections)
            .flatMap(section => section.dataElements)
            .map(getId)
            .value();

        const dataElements = await new Dhis2DataElement(this.api).get(dataElementIds);

        return dataSet.sections.map((section): Section => {
            const config = dataSetConfig.sections[section.id];

            const base: SectionBase = {
                id: section.id,
                name: section.displayName,
                toggle: { type: "none" },
                texts: config?.texts || defaultTexts,
                tabs: config?.tabs || { active: false },
                sortRowsBy: config?.sortRowsBy || "",
                disableComments: config?.disableComments ?? false,
                dataElements: _(section.dataElements)
                    .map(dataElementRef => {
                        const dataElement = dataElements[dataElementRef.id];
                        if (!dataElement) return undefined;
                        const deConfig = configDataForm.dataElementsConfig[dataElementRef.code];
                        const deHideConfig = deConfig?.selection?.visible;
                        const d2DataElement = deHideConfig
                            ? section.dataElements.find(de => de.code === deHideConfig.dataElementCode)
                            : undefined;
                        const deRelated = d2DataElement ? dataElements[d2DataElement.id] : undefined;
                        return {
                            ...dataElement,
                            disabledComments: deConfig?.disableComments || false,
                            related: deRelated
                                ? { dataElement: deRelated, value: deHideConfig?.value || "" }
                                : undefined,
                        };
                    })
                    .compact()
                    .value(),
                titleVariant: config?.titleVariant,
                styles: SectionStyle.buildSectionStyles(config?.styles),
                columnsDescriptions: config?.columnsDescriptions,
            };

            if (!config) return { viewType: "table", ...base };

            const base2 = getSectionBaseWithToggle(config, base);

            switch (config.viewType) {
                case "grid-with-periods":
                    return { viewType: config.viewType, periods: config.periods, ...base2 };
                case "grid-with-totals":
                    return { viewType: config.viewType, calculateTotals: config.calculateTotals, ...base2 };
                case "grid-with-subnational-ous":
                    return {
                        viewType: config.viewType,
                        subNationals: config?.subNationalDataset
                            ? _(configDataForm.subNationals)
                                  .filter((sn: SubNational) => sn.parentId === orgUnit)
                                  .sortBy(sn => sn.name)
                                  .value()
                            : [],
                        ...base2,
                    };

                default:
                    return { viewType: config.viewType, ...base2 };
            }
        });
    }
}

type Metadata = ReturnType<typeof getMetadataQuery>;
type D2DataSet = MetadataPick<Metadata>["dataSets"][number];

function getMetadataQuery(options: { dataSetId: Id }) {
    return {
        dataSets: {
            fields: {
                id: true,
                code: true,
                expiryDays: true,
                dataInputPeriods: {
                    closingDate: true,
                    openingDate: true,
                    period: {
                        id: true,
                    },
                },
                sections: {
                    id: true,
                    code: true,
                    displayName: true,
                    dataElements: {
                        id: true,
                        code: true,
                        categoryCombo: {
                            id: true,
                            name: true,
                            categoryOptionCombos: {
                                id: true,
                                name: true,
                                shortName: true,
                            },
                        },
                    },
                },
            },
            filter: { id: { eq: options.dataSetId } },
        },
    } as const;
}

function getSectionBaseWithToggle(config: SectionConfig, base: SectionBase): SectionBase {
    const { toggle } = config;

    switch (toggle.type) {
        case "dataElement": {
            const toggleDataElement = base.dataElements.find(de => de.code === toggle.code);

            if (toggleDataElement) {
                return {
                    ...base,
                    toggle: { type: "dataElement", dataElement: toggleDataElement },
                    dataElements: _.without(base.dataElements, toggleDataElement),
                };
            } else {
                console.warn(`Data element for toggle not found in section: ${toggle.code}`);
                return base;
            }
        }
        default:
            return base;
    }
}
