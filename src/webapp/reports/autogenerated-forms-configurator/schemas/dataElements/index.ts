import { mergeWithSchema } from "..";
import { dataElementSchema } from "./dataElement";

export const getDataElementSchema = (dataElementCodes: string[]) => {
    return {
        type: "object",
        properties: mergeWithSchema(dataElementCodes, dataElementSchema),
        additionalProperties: false,
    };
};
