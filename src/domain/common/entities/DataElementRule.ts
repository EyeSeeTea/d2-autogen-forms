import { Code } from "./Base";
import { DataElement } from "./DataElement";

export type RuleType = "visible" | "disabled" | "enabled" | "clear";

export type SingleConditionRule = {
    type?: "single";
    dataElements: Code[];
    condition: string;
};

type MultipleConditionRule = {
    type: "option";
    conditions: SingleConditionRule[];
};

export const STATE_CONDITIONS = {
    disabled: "disabled",
} as const;
type StateConditionRule = {
    type: "state";
    condition: typeof STATE_CONDITIONS[keyof typeof STATE_CONDITIONS];
};

export type ConditionRule = SingleConditionRule | MultipleConditionRule | StateConditionRule;

export type DataElementRuleOptions = Record<RuleType, ConditionRule>;
export type TotalConditionRule = Exclude<ConditionRule, { type: "state" }>;
export type TotalRuleType = Exclude<RuleType, "clear">;
export type TotalDataElementRuleOptions = Record<TotalRuleType, TotalConditionRule>;

export type SectionRuleOptions = { condition: string; sectionCodes: Code[] };

export type Rule = { relatedDataElement: DataElement; type: RuleType; condition: string };

export type DeleteRule = {
    condition: string;
    type: "delete";
    dataElements: Code[];
};

type BaseTotalRule = {
    conditions: string[];
    formula: string;
    relatedDataElements: DataElement[];
};

export type DataElementTotalRule = BaseTotalRule & {
    dataElements: string[];
    type: TotalRuleType;
};

export type SectionTotalRule = BaseTotalRule & {
    sections: string[];
};

export type TotalRules = {
    dataElementTotalRules: DataElementTotalRule[];
    sectionTotalRules: SectionTotalRule[];
};
