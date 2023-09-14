export const dataElementSchema = {
    type: "object",
    properties: {
        selection: {
            type: "object",
            properties: {
                optionSet: {
                    type: "object",
                    properties: {
                        code: "string",
                    },
                },
                isMultiple: {
                    type: "boolean",
                },
                widget: { enum: ["dropdown", "radio", "sourceType"] },
                visible: {
                    dataElementCode: { type: "string" },
                    value: { type: "string" },
                },
            },
            additionalProperties: false,
        },
    },
    additionalProperties: false,
};
