import _ from "lodash";
import { useCallback, useMemo, useState } from "react";
import { DataEntryItemProps } from "../DataEntryItem";
import { WidgetState } from "../WidgetFeedback";
import { getValueAccordingType } from "./useApplyRules";

export function useUpdatableDataValueWithFeedback(options: DataEntryItemProps) {
    const { cocId, dataFormInfo, dataElement, columnTotal, columnDataElements } = options;
    const [state, setState] = useState<WidgetState>("original");
    const selector = useMemo(() => {
        return {
            orgUnitId: options.dataElement.orgUnit || dataFormInfo.orgUnitId,
            period: options.period || dataFormInfo.period,
            categoryOptionComboId: dataFormInfo.categoryOptionComboId,
        };
    }, [
        options.dataElement.orgUnit,
        dataFormInfo.orgUnitId,
        options.period,
        dataFormInfo.period,
        dataFormInfo.categoryOptionComboId,
    ]);

    const dataValue = useMemo(
        () => dataFormInfo.data.values.getOrEmpty(dataElement, selector),
        [dataFormInfo.data.values, dataElement, selector]
    );

    const save = dataFormInfo.data.save;
    const saveWithTotals = dataFormInfo.data.saveWithTotals;

    const notifyChange = useCallback(
        dataValueCb => {
            setState("saving");
            if (columnTotal && columnDataElements && cocId) {
                return saveWithTotals(dataValueCb, columnTotal, columnDataElements, cocId)
                    .then(() => setState("saveSuccessful"))
                    .catch(() => setState("saveError"));
            } else {
                return save(dataValueCb)
                    .then(() => {
                        // validate compulsory fields
                        const value = getValueAccordingType(dataValueCb);
                        const isRequired = dataFormInfo.metadata.dataForm.compulsoryDataValues.find(
                            cdv => cdv.dataElementId === dataValue.dataElement.id && cdv.categoryOptionComboId === cocId
                        );
                        const state =
                            isRequired && (_.isNil(value) || _.isEmpty(value)) ? "required" : "saveSuccessful";
                        setState(state);
                    })
                    .catch(() => setState("saveError"));
            }
        },
        [
            columnDataElements,
            columnTotal,
            save,
            saveWithTotals,
            cocId,
            dataFormInfo.metadata.dataForm.compulsoryDataValues,
            dataValue.dataElement.id,
        ]
    );

    return [dataValue, state, notifyChange] as const;
}
