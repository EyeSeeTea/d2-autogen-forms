import _ from "lodash";
import { viewTypes } from ".";
import { defaultObjectProperties, mergeArrayWithSchema, textSchema } from "..";
import { DataElementSchema } from "../../../../../domain/autogenerated-forms-configurator/entities/DataElement";
import { SectionSchema } from "../../../../../domain/autogenerated-forms-configurator/entities/Section";

const styleBgColor = {
    backgroundColor: {
        type: "string",
    },
};

export const sectionSchema = (
    sections: SectionSchema[],
    dataElements: DataElementSchema[],
    constantCodes: string[]
) => {
    const dataElementCodes = dataElements.map(dataElement => dataElement.dataElementCode);
    const columnsDescriptions = _(sections)
        .flatMap(section => section.columnsDescriptions)
        .value();

    const sectionProperties = {
        columnsDescriptions: mergeArrayWithSchema(columnsDescriptions, textSchema(constantCodes)),
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
                footer: textSchema(constantCodes),
                header: textSchema(constantCodes),
                rowTotals: textSchema(constantCodes),
                totals: textSchema(constantCodes),
                name: textSchema(constantCodes),
            },
        }),
        toggle: defaultObjectProperties({
            properties: {
                type: {
                    enum: ["dataElement", "dataElementExternal"],
                },
                code: {
                    enum: dataElementCodes,
                },
                condition: {
                    type: "string",
                },
            },
        }),
        toggleMultiple: {
            type: "array",
            items: defaultObjectProperties({
                type: "object",
                properties: {
                    dataElement: { enum: dataElementCodes },
                    condition: { type: "string" },
                },
            }),
        },
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
                        dataElementCodes,
                        defaultObjectProperties({
                            properties: {
                                totalDeCode: {
                                    enum: dataElementCodes,
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
