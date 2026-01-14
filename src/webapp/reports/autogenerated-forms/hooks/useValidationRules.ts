import React from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
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
            setIgnoreRules(prev => addIgnoreRule(prev, rule));
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
                    setRules(results);
                })
                .catch(err => {
                    snackbar.error(err);
                });
        },
        [compositionRoot, dataForm, key, snackbar]
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

/**
 * Returns a new array including the new ignore rule.
 * If an ignore rule with the same validationRuleId exists, replaces it with the updated rule
 */
function addIgnoreRule(ignoreRules: IgnoreValidationRule[], rule: ValidationResult): IgnoreValidationRule[] {
    const newIgnoreRule: IgnoreValidationRule = {
        ...rule,
    };
    const existing = ignoreRules.some(previousItem => previousItem.validationRuleId === newIgnoreRule.validationRuleId);
    if (existing) {
        return ignoreRules.map(previousItem =>
            previousItem.validationRuleId === newIgnoreRule.validationRuleId ? newIgnoreRule : previousItem
        );
    }
    return [...ignoreRules, newIgnoreRule];
}
