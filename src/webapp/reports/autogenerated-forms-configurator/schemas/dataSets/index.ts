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

export const getDataSetSchema = (
    constants: string[],
    dsCode: string,
    deInSectionCodes: string[],
    sectionCodes: string[]
) => {
    return defaultObjectProperties({
        properties: {
            [dsCode]: defaultObjectProperties({
                properties: {
                    sections: defaultObjectProperties({
                        properties: mergeArrayWithSchema(sectionCodes, sectionSchema(constants, deInSectionCodes)),
                    }),
                    texts: {
                        properties: {
                            footer: textSchema(constants),
                            header: textSchema(constants),
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
