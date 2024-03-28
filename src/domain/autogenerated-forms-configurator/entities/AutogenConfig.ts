import { Code } from "../../common/entities/Base";

export interface AutogenConfig {
    categoryCombinations: unknown;
    dataElements: unknown;
    dataSets: unknown;
}

export interface CodedRef {
    name: string;
    code: Code;
}
