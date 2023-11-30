import React from "react";
import styled from "styled-components";
import { WidgetFeedback } from "../WidgetFeedback";
import { DataValuePercentage } from "../../../../domain/common/entities/DataValue";
import { WidgetProps } from "./WidgetBase";

export interface PercentageWidgetProps extends WidgetProps {
    dataValue: DataValuePercentage;
}

const PercentageWidget: React.FC<PercentageWidgetProps> = props => {
    const { onValueChange, dataValue, disabled } = props;

    const notifyChange = React.useCallback(
        ({ value: newValue }: { value: string }) => {
            const inputValue = parseFloat(newValue);

            if (dataValue.value !== newValue) {
                if (inputValue < 0 || inputValue > 100) {
                    alert("Value must be a percentage (between 0 and 100)");
                } else {
                    onValueChange({ ...dataValue, value: inputValue.toString() });
                }
            }
        },
        [dataValue, onValueChange]
    );

    return (
        <WidgetFeedback state={props.state}>
            {disabled ? (
                <CustomInput
                    disabled
                    type="number"
                    onBlur={e => notifyChange({ value: e.target.value })}
                    value={dataValue.value}
                />
            ) : (
                <CustomInput
                    type="number"
                    onBlur={e => notifyChange({ value: e.target.value })}
                    defaultValue={dataValue.value}
                />
            )}
        </WidgetFeedback>
    );
};

const CustomInput = styled.input`
    width: 100%;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 16px;
    user-select: text;
    color: rgb(33, 41, 52);
    background-color: white;
    padding: 12px 11px 10px;
    outline: 0px;
    border: 1px solid rgb(160, 173, 186);
    border-radius: 3px;
    box-shadow: rgba(48, 54, 60, 0.1) 0px 1px 2px 0px inset;
    text-overflow: ellipsis;

    &:disabled {
        background-color: rgb(248, 249, 250);
        border-color: rgb(160, 173, 186);
        color: rgb(110, 122, 138);
        cursor: not-allowed;
    }
`;

export default React.memo(PercentageWidget);
