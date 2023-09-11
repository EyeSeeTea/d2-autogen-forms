import { mergeWithSchema } from "..";

export const getDataSetSchema = (sectionCodes: string[], dsCode: string) => {
    return {
        type: "object",
        properties: {
            [dsCode]: {
                type: "object",
                properties: {
                    sections: {
                        type: "object",
                        properties: mergeWithSchema(sectionCodes),
                        required: sectionCodes,
                        additionalProperties: false,
                    },
                    texts: {
                        type: "object",
                    },
                    viewType: {
                        enum: ["grid", "grid-with-periods"],
                    },
                },
                required: ["sections", "texts", "viewType"],
            },
        },
        required: [dsCode],
        additionalProperties: false,
    };
};
