import { mergeWithSchema } from "..";

export const getCatComboSchema = (categoryComboCodes: string[]) => {
    const defaultProperties = {
        minProperties: 1,
        additionalProperties: false,
    };

    return {
        type: "object",
        properties: mergeWithSchema(categoryComboCodes, {
            type: "object",
            properties: {
                viewType: {
                    enum: ["name", "shortName"],
                },
            },
        }),
        ...defaultProperties,
    };
};
