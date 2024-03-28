import { Id } from "./Base";

export type ValidationResult = { validationRuleId: Id; leftValue: number; rightValue: number; message: string };
export type IgnoreValidationRule = { validationRuleId: Id; message: string };
