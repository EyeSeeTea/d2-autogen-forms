import { NamedRef } from "../../common/entities/Base";
import { DataElementSchema } from "./DataElement";

interface CodedRef {
    id: string;
    code: string;
}

interface DataElement extends CodedRef {
    optionSet?: CodedRef;
}

interface Section extends CodedRef {
    dataElements: DataElement[];
}

export interface DataSet extends NamedRef {
    code: string;
    sections: Section[];
    dataSetElements: { dataElement: DataElement; categoryCombo?: CodedRef }[];
}

export interface Marker {
    [key: string]: unknown;
}

export interface AutogenConfigSchema {
    constants: string[];
    dsCode: string;
    sectionCodes: string[];
    categoryComboCodes: string[];
    dataElements: DataElementSchema[];
}
