import { defaultObjectProperties, mergeArrayWithSchema, textSchema } from "..";

export const sectionSchema = (deInSectionCodes: string[]) => {
    return defaultObjectProperties({
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
            texts: defaultObjectProperties({
                properties: {
                    footer: textSchema(),
                    header: textSchema(),
                },
            }),
            toggle: defaultObjectProperties({
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
            tabs: defaultObjectProperties({
                properties: {
                    active: {
                        const: true,
                    },
                    order: {
                        type: "number",
                    },
                },
            }),
            periods: defaultObjectProperties({
                properties: {
                    type: { const: "relative-interval" },
                    endOffset: { type: "number" },
                    startOffset: { type: "number" },
                },
            }),
            calculateTotals: mergeArrayWithSchema(
                [],
                defaultObjectProperties({
                    properties: {
                        totalDeCode: "string",
                        disabled: "boolean",
                    },
                })
            ),
            rows: mergeArrayWithSchema(
                [],
                defaultObjectProperties({
                    properties: {
                        autoComputeTotals: "boolean",
                        disabled: "boolean",
                    },
                })
            ),
        },
    });
};
