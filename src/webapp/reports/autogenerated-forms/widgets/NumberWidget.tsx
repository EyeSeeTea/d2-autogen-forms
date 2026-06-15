import React from "react";
import styled from "styled-components";
import { WidgetFeedback } from "../WidgetFeedback";
import { DataValueNumberSingle } from "../../../../domain/common/entities/DataValue";
import { WidgetProps } from "./WidgetBase";
import { useNumericInputState } from "../hooks/useNumericInputState";

export interface NumberWidgetProps extends WidgetProps {
    dataValue: DataValueNumberSingle;
}

const NumberWidget: React.FC<NumberWidgetProps> = props => {
    const { onValueChange, dataValue, disabled } = props;

    const { value, isInvalid, onChange, onBlur } = useNumericInputState(dataValue, onValueChange);

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

export const CustomInput = styled.input`
    width: 100%;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 16px;
    user-select: text;
    color: rgb(33, 41, 52);
    background-color: white;
    padding: 12px 11px 10px;
    min-height: 48px;
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

export default React.memo(NumberWidget);
