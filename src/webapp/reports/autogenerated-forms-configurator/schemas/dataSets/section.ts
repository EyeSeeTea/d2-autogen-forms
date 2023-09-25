import { JSONSchema7 } from "json-schema";
import { mergeWithSchema } from "..";
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

export const sectionSchema = (deInSectionCodes: string[]) => {
    return {
        type: "object",
        properties: {
            disableComments: {
                type: "boolean",
            },
            subNationalDataset: {
                type: "string",
            },
            sortRowsBy: {
                type: "string",
            },
            viewType: {
                enum: [
                    "grid",
                    "grid-with-periods",
                    "grid-with-totals",
                    "table",
                    "grid-with-combos",
                    "grid-with-subnational-ous",
                ],
            },
            texts: {
                type: "object",
                properties: {
                    footer: { ...textSchema, ...defaultProperties },
                    header: { ...textSchema, ...defaultProperties },
                },
                ...defaultProperties,
            },
            toggle: {
                type: "object",
                properties: {
                    type: {
                        const: "dataElement",
                    },
                    code: {
                        enum: deInSectionCodes,
                    },
                },
                ...defaultProperties,
            },
            titleVariant: {
                enum: ["h1", "h2", "h3", "h4", "h5", "h6"],
            },
            tabs: {
                type: "object",
                properties: {
                    active: {
                        const: true,
                    },
                    order: {
                        type: "number",
                    },
                },
                ...defaultProperties,
            },
            periods: {
                type: "object",
                properties: {
                    type: { const: "relative-interval" },
                    endOffset: { type: "number" },
                    startOffset: { type: "number" },
                },
                ...defaultProperties,
            },
            calculateTotals: mergeWithSchema([], {
                type: "object",
                properties: {
                    totalDeCode: "string",
                    disabled: "boolean",
                },
                ...defaultProperties,
            }),
            rows: mergeWithSchema([], {
                type: "object",
                properties: {
                    autoComputeTotals: "boolean",
                    disabled: "boolean",
                },
                ...defaultProperties,
            }),
        },
        ...defaultProperties,
    };
};
