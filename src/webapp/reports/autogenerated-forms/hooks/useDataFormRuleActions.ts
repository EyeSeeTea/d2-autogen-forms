import React from "react";
import { DataFormRule } from "../../../../domain/common/entities/DataFormRule";
import { DataForm } from "../../../../domain/common/entities/DataForm";
import { Maybe } from "../../../../utils/ts-utils";

type UseDataFormRuleActionsResult = Record<DataFormRule["action"]["type"], Maybe<DataFormRule["action"]>>;

/**
 * Gets one possible rule action per action type
 */
export function useDataFormRuleActions(dataForm: Maybe<DataForm>): UseDataFormRuleActionsResult {
    // TODO: Used to keep things simple, evaluate this behavior if this feature grows
    const result = React.useMemo<UseDataFormRuleActionsResult>(() => {
        return {
            displayWarning: dataForm?.rules?.find(rule => rule.action.type === "displayWarning")?.action ?? undefined,
        };
    }, [dataForm]);
    return result;
}
