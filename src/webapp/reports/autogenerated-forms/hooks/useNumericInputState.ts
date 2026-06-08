import React, { useCallback, useEffect } from "react";
import { isValidNumber, sanitizeNumericInput } from "../../../../utils/string";
import { DataValue, DataValueNumberSingle, DataValuePercentage } from "../../../../domain/common/entities/DataValue";

/**
 * Input state for numeric text widgets, behaving the same across browsers.
 *
 * - `onChange` filters non-numeric characters live via {@link sanitizeNumericInput},
 *   ignoring any edit that would blank an already-saved value.
 * - `onBlur` commits through `onValueChange` when the value is empty (a clear) or passes
 *   `isValid` (defaults to {@link isValidNumber}); otherwise it sets `isInvalid` and keeps
 *   the value on screen unsaved, so an existing value is never overwritten with bad data.
 */
export function useNumericInputState(
    dataValue: DataValueNumberSingle | DataValuePercentage,
    onValueChange: (dataValue: DataValue) => void,
    isValid: (value: string) => boolean = isValidNumber
) {
    const [value, setValue] = React.useState(dataValue.value);
    const [isInvalid, setIsInvalid] = React.useState(false);

    useEffect(() => setValue(dataValue.value), [dataValue]);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const filtered = sanitizeNumericInput(raw);
        if (filtered === "" && raw !== "") return;
        setValue(filtered);
    }, []);

    const onCommit = useCallback(
        (newValue: string) => {
            if (newValue === "" || isValid(newValue)) {
                setIsInvalid(false);
                onValueChange({ ...dataValue, value: newValue });
            } else {
                setIsInvalid(true);
            }
        },
        [dataValue, onValueChange, isValid]
    );

    const onBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            if (newValue === dataValue.value) return;

            if (newValue === "" || isValid(newValue)) {
                setIsInvalid(false);
                onCommit(newValue);
            } else {
                setIsInvalid(true);
            }
        },
        [dataValue, onCommit, isValid]
    );

    return { value, isInvalid, onChange, onBlur };
}
