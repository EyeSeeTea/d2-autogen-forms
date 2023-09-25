import { JSONSchema7 } from "json-schema";
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

const defaultProperties = {
    minProperties: 1,
    additionalProperties: false,
};

const textSchema: JSONSchema7 = {
    oneOf: [
        {
            type: "object",
            properties: {
                type: { type: "string" },
                code: { type: "string" },
            },
            ...defaultProperties,
        },
        {
            type: "string",
        },
    ],
    ...defaultProperties,
};

export const getDataSetSchema = (dsCode: string, deInSectionCodes: string[], sectionCodes: string[]) => {
    return {
        type: "object",
        properties: {
            [dsCode]: {
                type: "object",
                properties: {
                    sections: {
                        type: "object",
                        properties: mergeWithSchema(sectionCodes, sectionSchema(deInSectionCodes)),
                        ...defaultProperties,
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
                ...defaultProperties,
            },
        },
        ...defaultProperties,
    };
};

// export const textSchema: JSONSchema7 = () => ({
//     oneOf: [
//         {
//             type: "object",
//             properties: {
//                 type: { type: "string" },
//                 code: { type: "string" },
//             },
//             ...defaultProperties,
//         },
//         {
//             type: "string",
//         },
//     ],

//     ...defaultProperties,
// })
