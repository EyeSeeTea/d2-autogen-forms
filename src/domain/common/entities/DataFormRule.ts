import { Period } from "./DataValue";

export type DataFormRule = {
    conditions: DataFormRuleConditions;
    action: DataFormRuleAction;
};

type DataFormRuleConditions = {
    periodIn?: string[];
};

type DataFormRuleAction = ShowWarningAction;

type ShowWarningAction = {
    type: "displayWarning";
    text: string;
    blockEntry: boolean;
};

type DataFormRuleContext = {
    period: Period;
};

function evaluateDataFormRuleCondition(rule: DataFormRule, context: DataFormRuleContext): boolean {
    if (rule.conditions.periodIn) {
        return rule.conditions.periodIn.includes(context.period);
    }
    return false;
}

export function getApplicableDataFormRules(
    rules: DataFormRule[] | undefined,
    context: DataFormRuleContext
): DataFormRule[] {
    if (!rules) {
        return [];
    }
    return rules.filter(rule => evaluateDataFormRuleCondition(rule, context));
}
