import { defaultProperties } from "..";
import { dataElementSchema } from "./dataElement";

export const getDataElementSchema = (dataElements: { dataElementCode: string; optionSetCode?: string }[]) => {
    return defaultProperties({
        type: "object",
        properties: dataElementSchema(dataElements),
    });
};
