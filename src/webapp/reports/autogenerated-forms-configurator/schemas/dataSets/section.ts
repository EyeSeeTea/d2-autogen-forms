import { viewTypes } from ".";
import { defaultObjectProperties, mergeArrayWithSchema, textSchema } from "..";

const styleBgColor = {
    backgroundColor: {
        type: "string",
    },
};

export const sectionSchema = (constants: string[], deInSectionCodes: string[]) => {
    const sectionProperties = {
        disableComments: {
            type: "boolean",
        },
        sortRowsBy: {
            type: "string",
        },
        viewType: {
            enum: viewTypes,
        },
        texts: defaultObjectProperties({
            properties: {
                footer: textSchema(constants),
                header: textSchema(constants),
                rowTotals: textSchema(constants),
                totals: textSchema(constants),
                name: textSchema(constants),
            },
        }),
        toggle: defaultObjectProperties({
            properties: {
                type: {
                    enum: ["dataElement", "dataElementExternal"],
                },
                code: {
                    enum: deInSectionCodes,
                },
                condition: {
                    type: "string",
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
        styles: defaultObjectProperties({
            properties: {
                rows: defaultObjectProperties({ properties: styleBgColor }),
                columns: defaultObjectProperties({ properties: styleBgColor }),
                title: defaultObjectProperties({ properties: styleBgColor }),
                totals: defaultObjectProperties({ properties: styleBgColor }),
            },
        }),
        totals: {
            type: "object",
            properties: {
                dataElementsCodes: { type: "array" },
                formula: { type: "string" },
                formulas: {
                    type: "object",
                    additionalProperties: { type: "object", properties: { formula: { type: "string" } } },
                },
            },
        },
    };

    return {
        type: "object",
        minProperties: 1,
        properties: sectionProperties,
        if: { properties: { viewType: { const: "grid-with-periods" } } },
        then: {
            properties: {
                periods: defaultObjectProperties({
                    properties: {
                        type: { const: "relative-interval" },
                        endOffset: { type: "number" },
                        startOffset: { type: "number" },
                    },
                }),
                ...sectionProperties,
            },
        },
        else: {
            if: { properties: { viewType: { const: "grid-with-totals" } } },
            then: {
                properties: {
                    calculateTotals: mergeArrayWithSchema(
                        deInSectionCodes,
                        defaultObjectProperties({
                            properties: {
                                totalDeCode: {
                                    enum: deInSectionCodes,
                                },
                                disabled: "boolean",
                            },
                        })
                    ),
                    ...sectionProperties,
                },
            },
            else: {
                if: { properties: { viewType: { const: "grid-with-subnational-ous" } } },
                then: {
                    properties: {
                        subNationalDataset: {
                            type: "string",
                        },
                        ...sectionProperties,
                    },
                },
                else: {
                    properties: sectionProperties,
                },
            },
        },
    };
};
