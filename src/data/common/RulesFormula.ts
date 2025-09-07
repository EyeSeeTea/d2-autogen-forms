import { array, Codec, exactly, oneOf, record, string, GetType } from "purify-ts";
import { Code } from "../../domain/common/entities/Base";

export const rulesFormulaCodec = record(
    oneOf([exactly("visible"), exactly("disabled")]),
    Codec.interface({
        formula: Codec.interface({ value: string, condition: string }),
        dataElements: array(Codec.interface({ code: string })),
    })
);

export type FromRulesFormulaCodec = GetType<typeof rulesFormulaCodec>;

export type RulesFormula = {
    visible?: FormulaDetails;
    disabled?: FormulaDetails;
};
export type ColumnsRules = Record<string, RulesFormula>;

type FormulaDetails = {
    formula: { condition: string; value: string };
    dataElements: Array<{ code: Code }>;
};
