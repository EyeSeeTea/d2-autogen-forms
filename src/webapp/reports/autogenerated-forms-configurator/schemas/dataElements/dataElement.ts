import _ from "lodash";

const defaultProperties = {
    minProperties: 1,
    additionalProperties: false,
};

export const dataElementSchema = (
    dataElements: {
        dataElementCode: string;
        optionSetCode?: string | undefined;
    }[]
) => {
    return _.chain(dataElements)
        .map(item => ({
            [item.dataElementCode]: {
                type: "object",
                properties: {
                    selection: {
                        properties: {
                            optionSet: {
                                properties: {
                                    code: {
                                        type: "string",
                                        const: item.optionSetCode,
                                    },
                                },
                                type: "object",
                                ...defaultProperties,
                            },
                            isMultiple: {
                                type: "boolean",
                            },
                            widget: { enum: ["dropdown", "radio", "sourceType"] },
                            visible: {
                                type: "object",
                                properties: {
                                    dataElementCode: { type: "string" },
                                    value: { type: "string" },
                                },
                                ...defaultProperties,
                            },
                        },
                        type: "object",
                        ...defaultProperties,
                    },
                },
                ...defaultProperties,
            },
        }))
        .reduce((acc, item) => ({ ...acc, ...item }), {})
        .value();
};
