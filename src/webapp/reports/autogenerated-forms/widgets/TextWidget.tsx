import React from "react";
// @ts-ignore
import { Input, TextArea } from "@dhis2/ui";
import { WidgetFeedback } from "../WidgetFeedback";
import { DataValueTextSingle } from "../../../../domain/common/entities/DataValue";
import { WidgetProps } from "./WidgetBase";
import i18n from "../../../../locales";
import { Maybe } from "../../../../utils/ts-utils";

export interface TextWidgetProps extends WidgetProps {
    dataValue: DataValueTextSingle;
}

const TextWidget: React.FC<TextWidgetProps> = props => {
    const { onValueChange, dataValue, disabled } = props;

    const [stateValue, setStateValue] = React.useState(dataValue.value);
    const [emailError, setEmailError] = React.useState<Maybe<string>>();
    React.useEffect(() => setStateValue(dataValue.value), [dataValue.value]);

    const updateState = React.useCallback(
        ({ value }: { value: string }) => {
            setStateValue(value);
            if (dataValue.dataElement.isEmail && value) {
                if (!validateEmail(value)) {
                    setEmailError(i18n.t("Please enter a valid email address"));
                } else {
                    setEmailError(undefined);
                }
            }
        },
        [dataValue.dataElement.isEmail]
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
        [onValueChange, dataValue]
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

// Note: This regex validation is not the same as DHIS2's backend validation.
// For example, john@doe.coma is valid for this regex but invalid for DHIS2.
// This is acceptable since we still get the error from DHIS2 backend.
const validateEmail = (email: string) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
