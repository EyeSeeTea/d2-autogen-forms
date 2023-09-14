import _ from "lodash";
import { getDataSetSchema } from "./dataSets";
import { getDataElementSchema } from "./dataElements";
import { getCatComboSchema } from "./categoryCombinations";

export const getJsonSchema = (dataElementCodes: string[], sectionCodes: string[], dsCode: string) => {
    return {
        uri: "http://d2-autogen-forms/configurator.json",
        fileMatch: ["*"],
        schema: {
            type: "object",
            properties: {
                dataSets: getDataSetSchema(sectionCodes, dsCode),
                dataElements: getDataElementSchema(dataElementCodes),
                categoryCombinations: getCatComboSchema(),
            },
            required: ["dataSets"],
            additionalProperties: false,
        },
    };
};

export function mergeWithSchema(codes: string[], schema: any) {
    const result = _.map(codes, code => ({ [code]: schema }));
    const mergedResult = _.merge({}, ...result);

    return mergedResult;
}
