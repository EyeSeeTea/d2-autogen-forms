import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import _ from "lodash";
import { IgnoreValidationRule, ValidationResult } from "../../../../domain/common/entities/ValidationResult";
import { DataForm } from "../../../../domain/common/entities/DataForm";
import { DataValue } from "../../../../domain/common/entities/DataValue";
import { Maybe } from "../../../../utils/ts-utils";
import { useAppContext } from "../../../contexts/app-context";

interface UseValidationRulesOptions {
    dataForm: Maybe<DataForm>;
}

export function useValidationRules(options: UseValidationRulesOptions) {
    const { dataForm } = options;
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const [key] = React.useState(0);
    const [ignoreRules, setIgnoreRules] = React.useState<IgnoreValidationRule[]>([]);
    const [rules, setRules] = React.useState<ValidationResult[]>([]);

    const onCloseAlert = React.useCallback((rule: ValidationResult) => {
        setIgnoreRules(prev => {
            const newIgnoreRules = [...prev, { validationRuleId: rule.validationRuleId, message: rule.message }];
            return newIgnoreRules;
        });
    }, []);

    const checkValidationRules = React.useCallback(
        (dataValue: DataValue) => {
            if (!dataForm) return;

            compositionRoot.dataSet
                .validate(dataForm.id, {
                    cacheKey: key,
                    period: dataValue.period,
                    orgUnitId: dataValue.orgUnitId,
                    removePrefix: dataForm.removePrefix,
                })
                .then(results => {
                    const oldIgnoredRules = removeRulesHasChanged(ignoreRules, results);
                    setIgnoreRules(oldIgnoredRules);
                    setRules(results);
                })
                .catch(err => {
                    snackbar.error(err);
                });
        },
        [compositionRoot, dataForm, key, ignoreRules, snackbar]
    );

    const resetRules = React.useCallback(() => {
        setRules([]);
        setIgnoreRules([]);
    }, []);

    return {
        rules,
        ignoreRules,
        onCloseAlert,
        checkValidationRules,
        resetRules,
    };
}

function removeRulesHasChanged(
    ignoreRules: IgnoreValidationRule[],
    results: ValidationResult[]
): IgnoreValidationRule[] {
    return _(ignoreRules)
        .map(ignoreRule => {
            const rule = results.find(
                result =>
                    result.message === ignoreRule.message && result.validationRuleId === ignoreRule.validationRuleId
            );
            return rule ? { validationRuleId: rule.validationRuleId, message: rule.message } : undefined;
        })
        .compact()
        .value();
}
