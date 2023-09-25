import { defaultProperties, mergeWithSchema } from "..";

export const getCatComboSchema = (categoryComboCodes: string[]) => {
    return {
        type: "object",
        properties: mergeWithSchema(
            categoryComboCodes,
            defaultProperties({
                type: "object",
                properties: {
                    viewType: {
                        enum: ["name", "shortName"],
                    },
                },
            })
        ),
    };
};
