import {
    RuleRepository,
    ValidateDataSetOptions,
} from "../../domain/autogenerated-forms-configurator/repositories/RuleRepository";

import { Id } from "../../domain/common/entities/Base";
import { ValidationResult } from "../../domain/common/entities/ValidationResult";
import { ValidationRule } from "../../domain/common/entities/ValidationRule";
import { D2Api } from "../../types/d2-api";

export class RuleD2Repository implements RuleRepository {
    constructor(private api: D2Api) {}

    async getByDataSet(dataSetId: string): Promise<ValidationRule[]> {
        const response = await this.api.models.validationRules
            .get({ fields: { id: true, displayDescription: true, operator: true }, paging: false, dataSet: dataSetId })
            .getData();

        return response.objects.map(d2ValidationRule => {
            return new ValidationRule(
                d2ValidationRule.id,
                d2ValidationRule.displayDescription,
                d2ValidationRule.operator
            );
        });
    }

    async validate(dataSetId: string, options: ValidateDataSetOptions): Promise<ValidationResult[]> {
        const response = await this.api
            .get<D2ValidationResultResponse>(`/validation/dataSet/${dataSetId}.json`, {
                pe: options.period,
                ou: options.orgUnitId,
            })
            .getData();

        return response.validationRuleViolations.map((ruleViolation): ValidationResult => {
            return {
                leftValue: ruleViolation.leftsideValue,
                rightValue: ruleViolation.rightsideValue,
                validationRuleId: ruleViolation.validationRule.id,
                message: ruleViolation.validationRule.displayName,
            };
        });
    }
}

export type ValidationRuleOptions = {
    dataSetId: Id;
};

export type D2ValidationResultResponse = {
    validationRuleViolations: Array<{
        validationRule: { id: Id; displayName: string };
        leftsideValue: number;
        rightsideValue: number;
    }>;
};
