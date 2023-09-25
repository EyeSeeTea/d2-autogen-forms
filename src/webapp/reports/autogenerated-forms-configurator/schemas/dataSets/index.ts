import { defaultProperties, mergeWithSchema, textSchema } from "..";
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
    return defaultProperties({
        type: "object",
        properties: {
            [dsCode]: defaultProperties({
                type: "object",
                properties: {
                    sections: defaultProperties({
                        type: "object",
                        properties: mergeWithSchema(sectionCodes, sectionSchema(deInSectionCodes)),
                    }),
                    texts: {
                        type: "object",
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
