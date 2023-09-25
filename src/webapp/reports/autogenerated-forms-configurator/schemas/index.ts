import _ from "lodash";
import { JSONSchema7 } from "json-schema";
import { getDataSetSchema } from "./dataSets";
import { getDataElementSchema } from "./dataElements";
import { getCatComboSchema } from "./categoryCombinations";

export interface JsonSchemaProps {
    dataElements: { dataElementCode: string; optionSetCode?: string }[];
    deInSectionCodes: string[];
    dsCode: string;
    sectionCodes: string[];
    categoryComboCodes: string[];
}

export const getJsonSchema = (props: JsonSchemaProps) => {
    const { dsCode, dataElements, deInSectionCodes, sectionCodes, categoryComboCodes } = props;

    return {
        uri: "http://d2-autogen-forms/configurator.json",
        fileMatch: ["*"],
        schema: defaultProperties({
            type: "object",
            properties: {
                dataSets: getDataSetSchema(dsCode, deInSectionCodes, sectionCodes),
                dataElements: getDataElementSchema(dataElements),
                categoryCombinations: getCatComboSchema(categoryComboCodes),
            },
        }),
    };
};

export function mergeWithSchema<T>(codes: string[], schema: T) {
    const result = _.map(codes, code => ({ [code]: schema }));
    const mergedResult = _.merge({}, ...result);

    return mergedResult;
}

export function defaultProperties<T>(object: T) {
    return {
        ...object,
        minProperties: 1,
        additionalProperties: false,
    };
}

export function textSchema(): JSONSchema7 {
    return {
        oneOf: [
            defaultProperties({
                type: "object",
                properties: {
                    type: { type: "string" },
                    code: { type: "string" },
                },
            }),
            {
                type: "string",
            },
        ],
    };
}
