import { Period } from "./DataValue";

export type CustomRule = {
    conditions: CustomRuleConditions;
    action: CustomRuleAction;
};

type CustomRuleConditions = {
    periodIn?: string[];
};

type CustomRuleAction = ShowWarningAction;

type ShowWarningAction = {
    type: "displayWarning";
    text: string;
    blockEntry: boolean;
};

type CustomRuleContext = {
    period: Period;
};

function evaluateCustomRuleCondition(rule: CustomRule, context: CustomRuleContext): boolean {
    if (rule.conditions.periodIn) {
        return rule.conditions.periodIn.includes(context.period);
    }
    return false;
}

export function getApplicableCustomRules(rules: CustomRule[] | undefined, context: CustomRuleContext): CustomRule[] {
    if (!rules) {
        return [];
    }
    return rules.filter(rule => evaluateCustomRuleCondition(rule, context));
}
