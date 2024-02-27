import { Maybe } from "../../../utils/ts-utils";
import { Code } from "./AutogenConfig";
import { CategoryCombo } from "./CategoryCombo";

export interface DataElement {
    code: Code;
    optionSet?: { code: Code };
    categoryCombo?: CategoryCombo;
}

export interface DataElementSchema {
    dataElementCode: string;
    optionSetCode: Maybe<string>;
}
