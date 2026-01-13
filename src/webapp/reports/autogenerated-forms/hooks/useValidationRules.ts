import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import _ from "lodash";
import { IgnoreValidationRule, ValidationResult } from "../../../../domain/common/entities/ValidationResult";
import { DataForm } from "../../../../domain/common/entities/DataForm";
import { DataValue } from "../../../../domain/common/entities/DataValue";
import { Maybe } from "../../../../utils/ts-utils";
import { useAppContext } from "../../../contexts/app-context";
import { useLocalStorage } from "../../../hooks/useLocalStorage";

interface UseValidationRulesOptions {
    dataForm: Maybe<DataForm>;
}

interface ValidationContext {
    orgUnitId: string;
    period: string;
}

function buildIgnoreRulesKey(
    dataFormId: string | undefined,
    context: ValidationContext | undefined
): string | undefined {
    if (!dataFormId || !context) return undefined;
    return `autogen-ignorerules-${dataFormId}-${context.orgUnitId}-${context.period}`;
}

export function useValidationRules(options: UseValidationRulesOptions) {
    const { dataForm } = options;
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const [key] = React.useState(0);
    const [validationContext, setValidationContext] = React.useState<ValidationContext>();
    const [rules, setRules] = React.useState<ValidationResult[]>([]);

    const ignoreRulesKey = buildIgnoreRulesKey(dataForm?.id, validationContext);
    const [ignoreRules, setIgnoreRules] = useLocalStorage<IgnoreValidationRule[]>(ignoreRulesKey, []);

    const onCloseAlert = React.useCallback(
        (rule: ValidationResult) => {
            setIgnoreRules(prev => {
                const newIgnoreRules = [...prev, { validationRuleId: rule.validationRuleId, message: rule.message }];
                return newIgnoreRules;
            });
        },
        [setIgnoreRules]
    );

    const checkValidationRules = React.useCallback(
        (dataValue: DataValue) => {
            if (!dataForm) return;

            setValidationContext({ orgUnitId: dataValue.orgUnitId, period: dataValue.period });

            compositionRoot.dataSet
                .validate(dataForm.id, {
                    cacheKey: key,
                    period: dataValue.period,
                    orgUnitId: dataValue.orgUnitId,
                    removePrefix: dataForm.removePrefix,
                })
                .then(results => {
                    setIgnoreRules(prev => removeRulesHasChanged(prev, results));
                    setRules(results);
                })
                .catch(err => {
                    snackbar.error(err);
                });
        },
        [compositionRoot, dataForm, key, setIgnoreRules, snackbar]
    );

    const resetRules = React.useCallback(() => {
        setRules([]);
        setValidationContext(undefined);
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
