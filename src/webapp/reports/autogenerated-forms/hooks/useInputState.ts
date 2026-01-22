import React from "react";

export function useInputState<TInputValue>(srcValue: TInputValue) {
    const [value, setValue] = React.useState(srcValue);

    React.useEffect(() => setValue(srcValue), [srcValue]);
    const onChange = React.useCallback(
        (e: React.ChangeEvent<{ value: unknown }>) => setValue(e.target.value as TInputValue),
        []
    );

    return { value, onChange };
}
