import React from "react";
// @ts-ignore
import { Input, TextArea } from "@dhis2/ui";
import { WidgetFeedback } from "../WidgetFeedback";
import { DataValueTextSingle } from "../../../../domain/common/entities/DataValue";
import { WidgetProps } from "./WidgetBase";

export interface TextWidgetProps extends WidgetProps {
    dataValue: DataValueTextSingle;
}

const TextWidget: React.FC<TextWidgetProps> = props => {
    const { onValueChange, dataValue, disabled } = props;

    const [stateValue, setStateValue] = React.useState(dataValue.value);
    const [emailError, setEmailError] = React.useState<string | undefined>();
    React.useEffect(() => setStateValue(dataValue.value), [dataValue.value]);

    const validateEmail = React.useCallback((email: string) => {
        if (!email) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    const updateState = React.useCallback(
        ({ value }: { value: string }) => {
            setStateValue(value);
            if (dataValue.dataElement.isEmail && value) {
                if (!validateEmail(value)) {
                    setEmailError("Please enter a valid email address");
                } else {
                    setEmailError(undefined);
                }
            }
        },
        [dataValue.dataElement.isEmail, validateEmail]
    );

    const notifyChange = React.useCallback(
        ({ value: newValue }: { value: string }) => {
            if (dataValue.dataElement.isEmail && newValue && !validateEmail(newValue)) {
                return;
            }
            if (dataValue.value !== newValue) {
                onValueChange({ ...dataValue, value: newValue });
            }
        },
        [onValueChange, dataValue, validateEmail]
    );

    return (
        <WidgetFeedback state={props.state}>
            {dataValue.dataElement.isLongText ? (
                <TextArea onBlur={notifyChange} onChange={updateState} value={stateValue} disabled={disabled} />
            ) : (
                <Input
                    onBlur={notifyChange}
                    onChange={updateState}
                    value={stateValue}
                    disabled={disabled}
                    type={dataValue.dataElement.isEmail ? "email" : "text"}
                    error={emailError ? true : false}
                    validationText={emailError}
                />
            )}
        </WidgetFeedback>
    );
};

export default React.memo(TextWidget);
