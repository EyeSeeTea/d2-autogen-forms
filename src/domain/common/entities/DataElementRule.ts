import { Code } from "./Base";
import { DataElement } from "./DataElement";

export type RuleType = "visible" | "disabled" | "enabled";

export type SingleConditionRule = {
    type?: "single";
    dataElements: Code[];
    condition: string;
};

type MultipleConditionRule = {
    type: "option";
    conditions: SingleConditionRule[];
};

export type ConditionRule = SingleConditionRule | MultipleConditionRule;

export type DataElementRuleOptions = Record<RuleType, ConditionRule>;

export type SectionRuleOptions = { condition: string; sectionCodes: Code[] };

export type Rule = { relatedDataElement: DataElement; type: RuleType; condition: string };

type BaseTotalRule = {
    conditions: string[];
    formula: string;
    relatedDataElements: DataElement[];
};

export type DataElementTotalRule = BaseTotalRule & {
    dataElements: string[];
    type: RuleType;
};

export type SectionTotalRule = BaseTotalRule & {
    sections: string[];
};

export type TotalRules = {
    dataElementTotalRules: DataElementTotalRule[];
    sectionTotalRules: SectionTotalRule[];
};
