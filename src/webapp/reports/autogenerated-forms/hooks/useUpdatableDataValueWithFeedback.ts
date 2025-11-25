import { useCallback, useMemo, useState } from "react";
import { DataEntryItemProps } from "../DataEntryItem";
import { WidgetState } from "../WidgetFeedback";

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
        dataValue => {
            setState("saving");
            if (columnTotal && columnDataElements && cocId) {
                saveWithTotals(dataValue, columnTotal, columnDataElements, cocId)
                    .then(() => setState("saveSuccessful"))
                    .catch(() => setState("saveError"));
            } else {
                save(dataValue)
                    .then(() => setState("saveSuccessful"))
                    .catch(() => setState("saveError"));
            }
        },
        [columnDataElements, columnTotal, save, saveWithTotals, cocId]
    );

    return [dataValue, state, notifyChange] as const;
}
