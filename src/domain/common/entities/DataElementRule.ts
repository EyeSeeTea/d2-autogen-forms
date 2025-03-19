import { Code } from "./Base";
import { DataElement } from "./DataElement";

export type RuleType = "visible" | "disabled";

export type DataElementRuleOptions = Record<RuleType, { dataElements: Code[]; condition: string }>;

export type SectionRuleOptions = { condition: string; sectionCodes: Code[] };

export type Rule = { relatedDataElement: DataElement; type: RuleType; condition: string };

type BaseTotalRule = {
    condition: string;
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
