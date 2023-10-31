import { defaultObjectProperties } from "..";
import { dataElementSchema } from "./dataElement";

export const getDataElementSchema = (dataElements: { dataElementCode: string; optionSetCode?: string }[]) => {
    return defaultObjectProperties({
        properties: dataElementSchema(dataElements),
    });
};
