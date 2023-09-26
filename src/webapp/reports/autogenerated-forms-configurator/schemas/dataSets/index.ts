import { defaultObjectProperties, mergeArrayWithSchema, textSchema } from "..";
import { sectionSchema } from "./section";

export const viewTypes = [
    "table",
    "grid",
    "grid-with-totals",
    "grid-with-combos",
    "grid-with-periods",
    "grid-with-subnational-ous",
];

export const getDataSetSchema = (dsCode: string, deInSectionCodes: string[], sectionCodes: string[]) => {
    return defaultObjectProperties({
        properties: {
            [dsCode]: defaultObjectProperties({
                properties: {
                    sections: defaultObjectProperties({
                        properties: mergeArrayWithSchema(sectionCodes, sectionSchema(deInSectionCodes)),
                    }),
                    texts: {
                        properties: {
                            footer: textSchema(),
                            header: textSchema(),
                        },
                    },
                    viewType: {
                        enum: viewTypes,
                    },
                    disableComments: {
                        type: "boolean",
                    },
                },
            }),
        },
    });
};
