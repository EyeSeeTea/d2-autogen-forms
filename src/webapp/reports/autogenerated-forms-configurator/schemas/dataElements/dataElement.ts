import _ from "lodash";
import { defaultObjectProperties } from "..";

export const dataElementSchema = (
    dataElements: {
        dataElementCode: string;
        optionSetCode?: string | undefined;
    }[]
) => {
    return _.chain(dataElements)
        .map(item => ({
            [item.dataElementCode]: defaultObjectProperties({
                properties: {
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
                                    dataElementCode: { type: "string" },
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
