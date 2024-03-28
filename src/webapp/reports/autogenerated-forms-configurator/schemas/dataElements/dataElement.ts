import _ from "lodash";
import { defaultObjectProperties, textSchema } from "..";

export const dataElementSchema = (
    dataElements: {
        dataElementCode: string;
        optionSetCode?: string | undefined;
    }[],
    constantCodes: string[]
) => {
    return _.chain(dataElements)
        .map(item => ({
            [item.dataElementCode]: defaultObjectProperties({
                properties: {
                    texts: defaultObjectProperties({
                        properties: {
                            footer: textSchema(constantCodes),
                            header: textSchema(constantCodes),
                            rowTotals: textSchema(constantCodes),
                            totals: textSchema(constantCodes),
                            name: textSchema(constantCodes),
                        },
                    }),
                    rules: defaultObjectProperties({
                        properties: {
                            visible: defaultObjectProperties({
                                properties: {
                                    condition: { type: "string" },
                                    dataElements: {
                                        items: {
                                            type: "string",
                                            enum: dataElements.map(dataElement => dataElement.dataElementCode),
                                        },
                                        type: "array",
                                    },
                                },
                            }),
                            disabled: defaultObjectProperties({
                                properties: {
                                    condition: { type: "string" },
                                    dataElements: { type: "array" },
                                },
                            }),
                        },
                    }),
                    selection: defaultObjectProperties({
                        properties: {
                            optionSet: defaultObjectProperties({
                                properties: {
                                    code: {
                                        type: "string",
                                        const: item.optionSetCode,
                                    },
                                },
                            }),
                            isMultiple: {
                                type: "boolean",
                            },
                            widget: { enum: ["dropdown", "radio", "sourceType"] },
                            visible: defaultObjectProperties({
                                properties: {
                                    dataElementCode: {
                                        enum: dataElements.map(dataElement => dataElement.dataElementCode),
                                    },
                                    value: { type: "string" },
                                },
                            }),
                        },
                    }),
                },
            }),
        }))
        .reduce((acc, item) => ({ ...acc, ...item }), {})
        .value();
};
