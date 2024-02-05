import { defaultObjectProperties } from "..";
import { dataElementSchema } from "./dataElement";

export const getDataElementSchema = (
    dataElements: { dataElementCode: string; optionSetCode?: string }[],
    constants: string[]
) => {
    return defaultObjectProperties({ properties: dataElementSchema(dataElements, constants) });
};
