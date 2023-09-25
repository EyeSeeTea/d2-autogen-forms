import { defaultProperties, mergeWithSchema, textSchema } from "..";

export const sectionSchema = (deInSectionCodes: string[]) => {
    return defaultProperties({
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
            texts: defaultProperties({
                type: "object",
                properties: {
                    footer: textSchema(),
                    header: textSchema(),
                },
            }),
            toggle: defaultProperties({
                type: "object",
                properties: {
                    type: {
                        const: "dataElement",
                    },
                    code: {
                        enum: deInSectionCodes,
                    },
                },
            }),
            titleVariant: {
                enum: ["h1", "h2", "h3", "h4", "h5", "h6"],
            },
            tabs: defaultProperties({
                type: "object",
                properties: {
                    active: {
                        const: true,
                    },
                    order: {
                        type: "number",
                    },
                },
            }),
            periods: defaultProperties({
                type: "object",
                properties: {
                    type: { const: "relative-interval" },
                    endOffset: { type: "number" },
                    startOffset: { type: "number" },
                },
            }),
            calculateTotals: mergeWithSchema(
                [],
                defaultProperties({
                    type: "object",
                    properties: {
                        totalDeCode: "string",
                        disabled: "boolean",
                    },
                })
            ),
            rows: mergeWithSchema(
                [],
                defaultProperties({
                    type: "object",
                    properties: {
                        autoComputeTotals: "boolean",
                        disabled: "boolean",
                    },
                })
            ),
        },
    });
};
