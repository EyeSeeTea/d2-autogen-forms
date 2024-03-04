import { Code } from "../../common/entities/Base";
import { CodedRef } from "./AutogenConfig";
import { CategoryCombo } from "./CategoryCombo";
import { DataElement, DataElementSchema } from "./DataElement";
import { Section, SectionSchema } from "./Section";

export interface DataSet extends CodedRef {
    sections: Section[];
    dataSetElements: { dataElement: DataElement; categoryCombo?: CategoryCombo }[];
}

export interface AutogenConfigSchema {
    constantCodes: Code[];
    sections: SectionSchema[];
    categoryComboCodes: Code[];
    dataElements: DataElementSchema[];
}
