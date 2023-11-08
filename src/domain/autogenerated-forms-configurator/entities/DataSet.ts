import { NamedRef } from "../../common/entities/Base";

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
