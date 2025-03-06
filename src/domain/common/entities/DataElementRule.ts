import { Code } from "./Base";
import { DataElement } from "./DataElement";

export type RuleType = "visible" | "disabled";

export type DataElementRuleOptions = Record<RuleType, { dataElements: Code[]; condition: string }>;

export type Rule = { relatedDataElement: DataElement; type: RuleType; condition: string };

export type TotalRule = {
    condition: string;
    formula: string;
    dataElements: string[];
    relatedDataElements: DataElement[];
    type: RuleType;
};
