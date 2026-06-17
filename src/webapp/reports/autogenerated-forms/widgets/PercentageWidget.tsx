import React from "react";
import { WidgetFeedback } from "../WidgetFeedback";
import { DataValuePercentage } from "../../../../domain/common/entities/DataValue";
import { WidgetProps } from "./WidgetBase";
import { useNumericInputState } from "../hooks/useNumericInputState";
import { isValidNumber } from "../../../../utils/string";
import { CustomInput } from "./NumberWidget";

export interface PercentageWidgetProps extends WidgetProps {
    dataValue: DataValuePercentage;
}

const PercentageWidget: React.FC<PercentageWidgetProps> = props => {
    const { onValueChange, dataValue, disabled } = props;

    const { isInvalid, value, onBlur, onChange } = useNumericInputState(dataValue, onValueChange, isValidPercentage);

    return (
        <WidgetFeedback state={isInvalid ? "saveError" : props.state}>
            {disabled ? (
                <CustomInput disabled type="text" inputMode="decimal" value={dataValue.value} />
            ) : (
                <CustomInput type="text" inputMode="decimal" onBlur={onBlur} value={value} onChange={onChange} />
            )}
        </WidgetFeedback>
    );
};

export default React.memo(PercentageWidget);

const isValidPercentage = (value: string): boolean =>
    isValidNumber(value) && Number(value) >= 0 && Number(value) <= 100;
