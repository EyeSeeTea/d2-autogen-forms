import React from "react";
import { CustomRule } from "../../../../domain/common/entities/CustomRule";
import { DataForm } from "../../../../domain/common/entities/DataForm";
import { Maybe } from "../../../../utils/ts-utils";

type UseCustomRuleActionsResult = Record<CustomRule["action"]["type"], Maybe<CustomRule["action"]>>;

/**
 * Gets one possible rule action per action type
 */
export function useCustomRuleActions(dataForm: Maybe<DataForm>): UseCustomRuleActionsResult {
    // TODO: Used to keep things simple, evaluate this behavior if this feature grows
    const result = React.useMemo<UseCustomRuleActionsResult>(() => {
        return {
            displayWarning:
                dataForm?.customRules?.find(rule => rule.action.type === "displayWarning")?.action ?? undefined,
        };
    }, [dataForm]);
    return result;
}
