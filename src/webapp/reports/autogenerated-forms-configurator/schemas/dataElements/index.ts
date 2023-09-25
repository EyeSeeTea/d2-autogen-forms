import { dataElementSchema } from "./dataElement";

const defaultProperties = {
    minProperties: 1,
    additionalProperties: false,
};

export const getDataElementSchema = (dataElements: { dataElementCode: string; optionSetCode?: string }[]) => {
    return {
        type: "object",
        properties: dataElementSchema(dataElements),
        ...defaultProperties,
    };
};
