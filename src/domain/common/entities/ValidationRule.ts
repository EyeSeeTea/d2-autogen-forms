import { Maybe } from "../../../utils/ts-utils";
import { Id } from "./Base";

export const allowedRules = [
    {
        name: "equal_to",
        operator: "=",
        opposite: "!=",
    },
    {
        name: "not_equal_to",
        operator: "!=",
        opposite: "=",
    },
    {
        name: "greater_than",
        operator: ">",
        opposite: "<",
    },
    {
        name: "greater_than_or_equal_to",
        operator: ">=",
        opposite: "<=",
    },
    {
        name: "less_than",
        operator: "<",
        opposite: ">",
    },
    {
        name: "less_than_or_equal_to",
        operator: "<=",
        opposite: ">=",
    },
] as const;
export type ValidationExpressionOperator = typeof allowedRules[number];
export type ValidationExpression = string;

export class ValidationRule {
    public readonly id: Id;
    public readonly message: string;
    public readonly operator: string;

    constructor(id: string, description: string, operator: string) {
        this.id = id;
        this.message = description;
        this.operator = operator;
    }

    get oppositeOperatorName(): Maybe<string> {
        return allowedRules.find(rule => rule.name === this.operator)?.opposite;
    }
}
