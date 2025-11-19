import _ from "lodash";

import { Maybe } from "../../../utils/ts-utils";
import { Id } from "../../common/entities/Base";
import { ValidationResult } from "../../common/entities/ValidationResult";
import { ValidationRule } from "../../common/entities/ValidationRule";
import { RuleRepository, ValidateDataSetOptions } from "../repositories/RuleRepository";

export class ValidateDatasetRulesUseCase {
    cachedRules: Maybe<{ value: ValidationRule[]; cacheKey: number }>;
    constructor(private ruleRepository: RuleRepository) {}

    async execute(dataSetId: Id, options: ValidateUseCaseOptions): Promise<ValidationResult[]> {
        const allRules = await this.getRules(dataSetId, options.cacheKey);
        const rules = this.filterRules(allRules, options);
        if (rules.length === 0) return [];
        const results = await this.ruleRepository.validate(dataSetId, options);
        return this.buildValidationRuleMessages(rules, results);
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

    private buildValidationRuleMessages(rules: ValidationRule[], results: ValidationResult[]): ValidationResult[] {
        const rulesByKey = _.keyBy(rules, "id");
        return _(results)
            .map((validationResult): Maybe<ValidationResult> => {
                const ruleDetails = rulesByKey[validationResult.validationRuleId];
                if (!ruleDetails) {
                    console.warn(`Cannot found validation rule: ${validationResult.validationRuleId}`);
                    return undefined;
                }

                return { ...validationResult, message: this.buildRuleMessage(ruleDetails) };
            })
            .compact()
            .value();
    }

    private buildRuleMessage(rule: ValidationRule): string {
        return rule.message;
    }

    private filterRules(rules: ValidationRule[], options: ValidateDataSetOptions): ValidationRule[] {
        return rules.filter(rule => {
            if (options.config?.ignoreCompulsoryPair) {
                const isCompulsoryPair = rule.operator === "compulsory_pair";
                if (isCompulsoryPair) return false;
            }
            if (options.config?.ignoreExclusivePair) {
                const isExclusivePair = rule.operator === "exclusive_pair";
                if (isExclusivePair) return false;
            }
            return true;
        });
    }
}

export interface ValidateUseCaseOptions extends ValidateDataSetOptions {
    cacheKey: number;
}
