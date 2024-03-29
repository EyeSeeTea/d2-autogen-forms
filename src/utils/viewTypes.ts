import _ from "lodash";
import { DataElement, getDataElementWithCode } from "../domain/common/entities/DataElement";
import { DescriptionText } from "../domain/common/entities/DataForm";
import { DataFormInfo } from "../webapp/reports/autogenerated-forms/AutogeneratedForm";
import { Maybe } from "./ts-utils";
import { DataValueTextSingle } from "../domain/common/entities/DataValue";

export function getDescription(
    description: DescriptionText,
    dataFormInfo: DataFormInfo,
    columnName: string
): Maybe<string> {
    const descriptionText = description ? description[columnName] : undefined;
    const dataElements = dataFormInfo.metadata.dataForm.dataElements;
    if (!descriptionText) return undefined;

    const dataElementCode = extractDECode(descriptionText) || "";
    const dataElement = getDataElementWithCode(dataElements, dataElementCode);
    const value = getValueFromDataElement(dataFormInfo, dataElement);

    const compiled = _.template(descriptionText);
    return compiled({ [dataElementCode]: value });
}

function getValueFromDataElement(dataFormInfo: DataFormInfo, dataElement: Maybe<DataElement>): Maybe<string> {
    if (!dataElement) return undefined;

    const { categoryOptionComboId, orgUnitId, period } = dataFormInfo;

    const dataValue = dataFormInfo.data.values.getOrEmpty(dataElement, {
        categoryOptionComboId: categoryOptionComboId,
        orgUnitId: orgUnitId,
        period: period,
    }) as DataValueTextSingle;
    const value = dataValue.value;

    return value ? transformString(value) : undefined;
}

const transformString = (string: string): string => {
    // transform the string to Title Case
    const stringParts = string.split("/");

    return stringParts.map(stringPart => _.startCase(stringPart.toLowerCase())).join("/");
};

const extractDECode = (string: string): string | undefined => {
    const match = string.match(/<%= (.+?) %>/);

    return match ? match[1] : "";
};
