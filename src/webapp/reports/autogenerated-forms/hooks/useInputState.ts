import React from "react";
import { Maybe } from "../../../../utils/ts-utils";

export function useInputState(srcValue: Maybe<string>) {
    const [value, setValue] = React.useState(srcValue);

    React.useEffect(() => setValue(srcValue), [srcValue]);
    const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value), []);

    return { value, onChange };
}
