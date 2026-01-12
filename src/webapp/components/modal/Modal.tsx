import React from "react";
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import { makeStyles } from "@material-ui/core/styles";
import i18n from "../../../locales";

const useStyles = makeStyles({
    onlyContent: {
        "& .MuiDialogTitle-root": {
            display: "none",
        },
        "& .MuiDialogActions-root": {
            display: "none",
        },
    },
});

function useDataEntryContentBoundingRectStyle() {
    const [rectStyle, setRectStyle] = React.useState<React.CSSProperties | undefined>(undefined);

    React.useEffect(() => {
        const contentDiv = document.getElementById("contentDiv");
        if (contentDiv) {
            const rect = contentDiv.getBoundingClientRect();
            setRectStyle({
                position: "fixed" as const,
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                right: 0,
                bottom: 0,
            });
        }
    }, []);

    return rectStyle;
}

export interface ModalProps {
    dismissable: boolean;
    text: string;
    title?: string;
}

/**
 * Modal dialog that is displayed only within the data entry content area
 */
export const Modal: React.FC<ModalProps> = ({ dismissable, text, title }) => {
    const classes = useStyles();
    const [isOpen, setIsOpen] = React.useState(true);
    const containerStyle = useDataEntryContentBoundingRectStyle();

    const className = !title && !dismissable ? classes.onlyContent : undefined;

    const handleClose = () => {
        if (dismissable) {
            setIsOpen(false);
        }
    };

    return (
        <ConfirmationDialog
            isOpen={isOpen}
            title={title}
            onCancel={dismissable ? handleClose : undefined}
            cancelText={dismissable ? i18n.t("Accept") : undefined}
            maxWidth="sm"
            fullWidth
            disableEnforceFocus
            disableBackdropClick={!dismissable}
            disableEscapeKeyDown={!dismissable}
            className={className}
            style={containerStyle}
            BackdropProps={{
                style: containerStyle,
            }}
        >
            <p>{text}</p>
        </ConfirmationDialog>
    );
};
