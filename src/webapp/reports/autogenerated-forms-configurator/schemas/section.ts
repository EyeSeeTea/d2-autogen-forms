export const sectionSchema = {
    type: "object",
    properties: {
        periods: {
            type: "string",
        },
        toggle: {
            type: "string",
        },
        viewType: {
            enum: ["grid", "grid-with-periods"],
        },
    },
    required: ["periods", "toggle", "viewType"],
    additionalProperties: false,
};
