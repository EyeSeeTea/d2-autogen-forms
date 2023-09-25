import _ from "lodash";
import { getDataSetSchema } from "./dataSets";
import { getDataElementSchema } from "./dataElements";
import { getCatComboSchema } from "./categoryCombinations";

export interface JsonSchemaProps {
    dataElements: { dataElementCode: string; optionSetCode?: string }[];
    deInSectionCodes: string[];
    dsCode: string;
    sectionCodes: string[];
}

export const defaultProperties = {
    minProperties: 1,
    additionalProperties: false,
};

export const getJsonSchema = (props: JsonSchemaProps) => {
    const { dsCode, dataElements, deInSectionCodes, sectionCodes } = props;

    return {
        uri: "http://d2-autogen-forms/configurator.json",
        fileMatch: ["*"],
        schema: {
            type: "object",
            properties: {
                dataSets: getDataSetSchema(dsCode, deInSectionCodes, sectionCodes),
                dataElements: getDataElementSchema(dataElements),
                categoryCombinations: getCatComboSchema(),
            },
            ...defaultProperties,
        },
    };
};

export function mergeWithSchema(codes: string[], schema: any) {
    const result = _.map(codes, code => ({ [code]: schema }));
    const mergedResult = _.merge({}, ...result);

    return mergedResult;
}
