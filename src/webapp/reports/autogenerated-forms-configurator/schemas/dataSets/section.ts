const textSchema = {
    type: "object",
    properties: {
        type: "string",
        code: "string",
    },
    required: ["code"],
    additionalProperties: false,
};

export const sectionSchema = {
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
                footer: textSchema,
                header: textSchema,
            },
            additionalProperties: false,
        },
        toggle: textSchema,
        titleVariant: {
            enum: ["h1", "h2", "h3", "h4", "h5", "h6"],
        },
        tabs: {
            type: "object",
            properties: {
                active: {
                    type: "true",
                },
                order: {
                    type: "number",
                },
            },
            required: ["active", "order"],
            additionalProperties: false,
        },
        periods: {
            type: "object",
            properties: {
                type: { enum: ["relative-period"] },
                endOffset: { type: "number" },
                startOffset: { type: "number" },
            },
            additionalProperties: false,
        },
        calculateTotals: {},
        rows: {},
    },
    required: ["viewType"],
    additionalProperties: false,
};
