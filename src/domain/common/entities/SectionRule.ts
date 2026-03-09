export type SectionRule = {
    conditions: SectionRuleConditions;
    action: SectionRuleAction;
};

type SectionRuleConditions = {
    orgUnitIn?: string[];
};

type SectionRuleAction = ShowMessageAction;

type ShowMessageAction = {
    type: "showMessage";
    text: string;
};

type SectionRuleContext = {
    orgUnitCode: string;
};

function evaluateSectionRuleCondition(rule: SectionRule, context: SectionRuleContext): boolean {
    if (rule.conditions.orgUnitIn) {
        return rule.conditions.orgUnitIn.includes(context.orgUnitCode);
    }
    return false;
}

export function getApplicableSectionRules(rules: SectionRule[], context: SectionRuleContext): SectionRule[] {
    return rules.filter(rule => evaluateSectionRuleCondition(rule, context));
}
