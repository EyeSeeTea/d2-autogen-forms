export interface AutogenConfig {
    categoryCombinations: unknown;
    dataElements: unknown;
    dataSets: unknown;
}

export type Code = string;

export interface CodedRef {
    name: string;
    code: Code;
}
