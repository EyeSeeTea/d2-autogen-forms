import _ from "lodash";
import { removePrefixFromWords } from "../../../utils/string";

import { Maybe } from "../../../utils/ts-utils";
import { Id } from "../../common/entities/Base";
import { ValidationResult } from "../../common/entities/ValidationResult";
import { ValidationRule } from "../../common/entities/ValidationRule";
import { RuleRepository, ValidateDataSetOptions } from "../repositories/RuleRepository";

export class ValidateDatasetRulesUseCase {
    cachedRules: Maybe<{ value: ValidationRule[]; cacheKey: number }>;
    constructor(private ruleRepository: RuleRepository) {}

    async execute(dataSetId: Id, options: ValidateUseCaseOptions): Promise<ValidationResult[]> {
        const rules = await this.getRules(dataSetId, options.cacheKey);
        if (rules.length === 0) return [];
        const results = await this.ruleRepository.validate(dataSetId, options);
        return this.buildValidationRuleMessages(rules, results, options.removePrefix);
    }

    private async getRules(dataSetId: Id, cacheKey: number): Promise<ValidationRule[]> {
        if (this.cachedRules && this.cachedRules.cacheKey === cacheKey) {
            return this.cachedRules.value;
        } else {
            const rules = await this.ruleRepository.getByDataSet(dataSetId);
            this.cachedRules = { value: rules, cacheKey: cacheKey };
            return rules;
        }
    }

    private buildValidationRuleMessages(
        rules: ValidationRule[],
        results: ValidationResult[],
        removePrefix: Maybe<string>
    ): ValidationResult[] {
        const rulesByKey = _.keyBy(rules, "id");
        return _(results)
            .map((validationResult): Maybe<ValidationResult> => {
                const ruleDetails = rulesByKey[validationResult.validationRuleId];
                if (!ruleDetails) {
                    console.warn(`Cannot found validation rule: ${validationResult.validationRuleId}`);
                    return undefined;
                }

                return { ...validationResult, message: this.buildRuleMessage(ruleDetails, removePrefix) };
            })
            .compact()
            .value();
    }

    private buildRuleMessage(rule: ValidationRule, removePrefix: Maybe<string>): string {
        return this.removePrefixFromDescription(rule.message, removePrefix);
    }

    private removePrefixFromDescription(description: string, removePrefix: Maybe<string>): string {
        if (!removePrefix) return description;
        return removePrefixFromWords(description, removePrefix);
    }
}

export interface ValidateUseCaseOptions extends ValidateDataSetOptions {
    cacheKey: number;
    removePrefix?: Maybe<string>;
}
