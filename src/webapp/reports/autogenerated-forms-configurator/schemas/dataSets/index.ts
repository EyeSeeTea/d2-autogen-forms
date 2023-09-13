import { mergeWithSchema } from "..";
import { sectionSchema } from "./section";

export const viewTypes = [
    "table",
    "grid",
    "grid-with-totals",
    "grid-with-combos",
    "grid-with-periods",
    "grid-with-subnational-ous",
];

export const textSchema = {
    type: "object",
    properties: {
        type: "string",
        code: "string",
    },
    required: ["code"],
    additionalProperties: false,
};

export const getDataSetSchema = (sectionCodes: string[], dsCode: string) => {
    return {
        type: "object",
        properties: {
            [dsCode]: {
                type: "object",
                properties: {
                    sections: {
                        type: "object",
                        properties: mergeWithSchema(sectionCodes, sectionSchema),
                        additionalProperties: false,
                    },
                    texts: {
                        type: "object",
                        properties: {
                            footer: textSchema,
                            header: textSchema,
                        },
                    },
                    viewType: {
                        enum: viewTypes,
                    },
                    disableComments: {
                        type: "boolean",
                    },
                },
                required: ["sections"],
                additionalProperties: false,
            },
        },
        required: [dsCode],
        additionalProperties: false,
    };
};
