import { JSONSchema6 } from "json-schema";
import { DataStoreConfigCodec } from "../../../../data/common/Dhis2DataStoreDataForm";

type AutogenConfigSchema = {
    uri: string;
    fileMatch: string[];
    schema: JSONSchema6;
};

export const autogenConfigSchema: AutogenConfigSchema = {
    uri: "http://d2-autogen-forms/configurator.json",
    fileMatch: ["*"],
    schema: DataStoreConfigCodec.schema(),
};
