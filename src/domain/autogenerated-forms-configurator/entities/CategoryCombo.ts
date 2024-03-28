import { Code } from "../../common/entities/Base";
import { CodedRef } from "./AutogenConfig";

export interface CategoryCombo {
    code: Code;
    categoryOptionCombos: CodedRef[];
}
