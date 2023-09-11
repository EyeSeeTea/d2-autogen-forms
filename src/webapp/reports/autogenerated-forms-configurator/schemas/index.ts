import _ from "lodash";
import { sectionSchema } from "./section";
import { getDataSetSchema } from "./dataSets";
import { getDataElementSchema } from "./dataElements";
import { getCatComboSchema } from "./categoryCombinations";

export const getJsonSchema = (sectionCodes: string[], dsCode: string) => {
    return {
        uri: "http://d2-autogen-forms/configurator.json",
        fileMatch: ["*"],
        schema: {
            type: "object",
            properties: {
                dataSets: getDataSetSchema(sectionCodes, dsCode),
                dataElements: getDataElementSchema(),
                categoryCombinations: getCatComboSchema(),
            },
            required: ["dataSets"],
            additionalProperties: false,
        },
    };
};

export function mergeWithSchema(codes: string[]) {
    const result = _.map(codes, code => ({ [code]: sectionSchema }));
    const mergedResult = _.merge({}, ...result);

    return mergedResult;
}
