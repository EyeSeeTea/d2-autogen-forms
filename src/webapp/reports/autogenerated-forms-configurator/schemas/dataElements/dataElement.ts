import _ from "lodash";
import { defaultProperties } from "..";

export const dataElementSchema = (
    dataElements: {
        dataElementCode: string;
        optionSetCode?: string | undefined;
    }[]
) => {
    return _.chain(dataElements)
        .map(item => ({
            [item.dataElementCode]: defaultProperties({
                type: "object",
                properties: {
                    selection: defaultProperties({
                        properties: {
                            optionSet: defaultProperties({
                                properties: {
                                    code: {
                                        type: "string",
                                        const: item.optionSetCode,
                                    },
                                },
                                type: "object",
                            }),
                            isMultiple: {
                                type: "boolean",
                            },
                            widget: { enum: ["dropdown", "radio", "sourceType"] },
                            visible: defaultProperties({
                                type: "object",
                                properties: {
                                    dataElementCode: { type: "string" },
                                    value: { type: "string" },
                                },
                            }),
                        },
                        type: "object",
                    }),
                },
            }),
        }))
        .reduce((acc, item) => ({ ...acc, ...item }), {})
        .value();
};
