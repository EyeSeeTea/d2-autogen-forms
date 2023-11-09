import _ from "lodash";
import { JSONSchema7 } from "json-schema";
import { getDataSetSchema } from "./dataSets";
import { getDataElementSchema } from "./dataElements";
import { getCatComboSchema } from "./categoryCombinations";

export interface JsonSchemaProps {
    constants: string[];
    dataElements: { dataElementCode: string; optionSetCode?: string }[];
    deInSectionCodes: string[];
    dsCode: string;
    sectionCodes: string[];
    categoryComboCodes: string[];
}

export const getJsonSchema = (props: JsonSchemaProps) => {
    const { dsCode, dataElements, deInSectionCodes, sectionCodes, categoryComboCodes, constants } = props;

    return {
        uri: "http://d2-autogen-forms/configurator.json",
        fileMatch: ["*"],
        schema: defaultObjectProperties({
            properties: {
                dataSets: getDataSetSchema(constants, dsCode, deInSectionCodes, sectionCodes),
                dataElements: getDataElementSchema(dataElements),
                categoryCombinations: getCatComboSchema(categoryComboCodes),
            },
        }),
    };
};

export function mergeArrayWithSchema<T>(codes: string[], schema: T) {
    const result = _.map(codes, code => ({ [code]: schema }));
    const mergedResult = _.merge({}, ...result);

    return mergedResult;
}

export function defaultObjectProperties<T>(object: T) {
    return {
        ...object,
        type: "object",
        minProperties: 1,
        additionalProperties: false,
    };
}

export function textSchema(constants: string[]): JSONSchema7 {
    return {
        anyOf: [
            defaultObjectProperties({
                type: "object",
                properties: {
                    code: { enum: constants },
                },
            }),
            {
                type: "string",
            },
        ],
    };
}
