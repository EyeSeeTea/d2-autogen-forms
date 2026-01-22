import { Id } from "./Base";

export type ValidationResult = { validationRuleId: Id; leftValue: number; rightValue: number; message: string };
export type IgnoreValidationRule = ValidationResult;

export function isSameValidationRule(a: IgnoreValidationRule, b: IgnoreValidationRule): boolean {
    return (
        a.validationRuleId === b.validationRuleId &&
        a.message === b.message &&
        a.leftValue === b.leftValue &&
        a.rightValue === b.rightValue
    );
}
