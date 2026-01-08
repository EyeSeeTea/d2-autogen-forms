import React from "react";
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import i18n from "../../../locales";

export interface ModalProps {
    dismissable: boolean;
    text: string;
    title: string;
}

export const Modal: React.FC<ModalProps> = ({ dismissable, text, title }) => {
    const [isOpen, setIsOpen] = React.useState(true);

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
        >
            <p>{text}</p>
        </ConfirmationDialog>
    );
};
