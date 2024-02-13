import { Maybe } from "../../../utils/ts-utils";
import { Id } from "./Base";

export type ValidationResult = { validationRuleId: Id; leftValue: number; rightValue: number; message: Maybe<string> };
