import React from "react";
import { Checkbox } from "@material-ui/core";
import { WidgetFeedback } from "../WidgetFeedback";
import { DataValueBoolean } from "../../../../domain/common/entities/DataValue";
import { WidgetProps } from "./WidgetBase";

export interface BooleanWidgetProps extends WidgetProps {
    dataValue: DataValueBoolean;
}

const BooleanDropdownWidget: React.FC<BooleanWidgetProps> = props => {
    const { onValueChange, dataValue, disabled } = props;

    const notifyChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onValueChange({ ...dataValue, value: event.target.checked });
        },
        [onValueChange, dataValue]
    );

    return (
        <WidgetFeedback state={props.state}>
            <Checkbox checked={dataValue.value === true} onChange={notifyChange} disabled={disabled} color="primary" />
        </WidgetFeedback>
    );
};

export default React.memo(BooleanDropdownWidget);
