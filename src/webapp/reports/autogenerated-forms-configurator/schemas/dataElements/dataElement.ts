import _ from "lodash";
import { defaultObjectProperties, textSchema } from "..";

type DataElementsSchemaProp = {
    dataElementCode: string;
    optionSetCode?: string | undefined;
};
function singleOrMultipleCondition(dataElements: DataElementsSchemaProp[], multipleAllowed = false) {
    const singleOnly = defaultObjectProperties({
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
    });
    if (multipleAllowed) {
        return {
            oneOf: [
                singleOnly,
                defaultObjectProperties({
                    type: "object",
                    properties: {
                        type: { type: "string", enum: ["option"] },
                        conditions: {
                            type: "array",
                            items: singleOnly,
                        },
                    },
                }),
            ],
        };
    } else {
        return singleOnly;
    }
}

export const dataElementRulesSchema = (dataElements: DataElementsSchemaProp[], hasDelete = false) =>
    defaultObjectProperties({
        properties: {
            visible: singleOrMultipleCondition(dataElements),
            disabled: singleOrMultipleCondition(dataElements, true),
            enabled: singleOrMultipleCondition(dataElements, true),
            ...(hasDelete ? { delete: singleOrMultipleCondition(dataElements, true) } : {}),
            ...(hasDelete
                ? {
                      clear: {
                          oneOf: [
                              singleOrMultipleCondition(dataElements),
                              defaultObjectProperties({
                                  properties: {
                                      condition: {
                                          type: "string",
                                          enum: ["disabled"],
                                      },
                                      type: { type: "string", enum: ["state"] },
                                  },
                              }),
                          ],
                      },
                  }
                : {}),
        },
    });

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
                    rules: dataElementRulesSchema(dataElements, true),
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
