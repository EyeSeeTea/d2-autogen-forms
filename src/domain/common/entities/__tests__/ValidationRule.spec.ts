import { ValidationRule, allowedRules } from "../ValidationRule";

describe("ValidationRule", () => {
    describe("constructor", () => {
        it("should initialize correctly with given parameters", () => {
            const id = "rule1";
            const description = "This is a test rule";
            const operator = "equal_to";

            const rule = new ValidationRule(id, description, operator);

            expect(rule.id).toBe(id);
            expect(rule.message).toBe(description);
            expect(rule.operator).toBe(operator);
        });
    });

    describe("oppositeOperatorName", () => {
        it("should return the opposite operator name when the operator is valid", () => {
            const id = "rule1";
            const description = "This is a test rule";
            const operator = "equal_to";

            const rule = new ValidationRule(id, description, operator);

            expect(rule.oppositeOperatorName).toBe("!=");
        });

        it("should return undefined when the operator is invalid", () => {
            const id = "rule1";
            const description = "This is a test rule";
            const operator = "invalid_operator";

            const rule = new ValidationRule(id, description, operator);

            expect(rule.oppositeOperatorName).toBeUndefined();
        });

        it("should return the correct opposite operator for all allowed rules", () => {
            allowedRules.forEach(rule => {
                const validationRule = new ValidationRule("rule1", "Test rule", rule.name);
                expect(validationRule.oppositeOperatorName).toBe(rule.opposite);
            });
        });
    });
});
