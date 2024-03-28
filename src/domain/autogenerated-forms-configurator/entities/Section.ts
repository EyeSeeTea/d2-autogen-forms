import { Code } from "../../common/entities/Base";
import { DataElement } from "./DataElement";

export interface Section {
    code: Code;
    dataElements: DataElement[];
}

export interface SectionSchema {
    code: string;
    columnsDescriptions: string[];
}
