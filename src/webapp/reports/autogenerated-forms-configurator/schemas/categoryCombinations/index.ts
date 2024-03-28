import { defaultObjectProperties, mergeArrayWithSchema } from "..";

export const getCatComboSchema = (categoryComboCodes: string[]) => {
    return {
        properties: mergeArrayWithSchema(
            categoryComboCodes,
            defaultObjectProperties({ properties: { viewType: { enum: ["name", "shortName", "formName"] } } })
        ),
    };
};
