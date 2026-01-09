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

export interface ModalProps {
    dismissable: boolean;
    text: string;
    title?: string;
}

export const Modal: React.FC<ModalProps> = ({ dismissable, text, title }) => {
    const classes = useStyles();
    const [isOpen, setIsOpen] = React.useState(true);

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
        >
            <p>{text}</p>
        </ConfirmationDialog>
    );
};
