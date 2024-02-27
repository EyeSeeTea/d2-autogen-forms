import { Code } from "./AutogenConfig";
import { DataElement } from "./DataElement";

export interface Section {
    code: Code;
    dataElements: DataElement[];
}

export interface SectionSchema {
    code: string;
    columnsDescriptions: string[];
}
