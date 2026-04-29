import React from "react";
import styled from "styled-components";
import { TextField } from "@material-ui/core";
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { shortNameMaxLength } from "../../../domain/common/entities/Constant";
import { useCreateConstantForm } from "./hooks/useCreateConstantForm";

type CreateConstantDialogProps = {
    open: boolean;
    prefix: string;
    canCreate: boolean;
    onClose: () => void;
    onSuccess: (code: string) => void;
};

export const CreateConstantDialog: React.FC<CreateConstantDialogProps> = React.memo(props => {
    const { open, prefix, canCreate, onClose } = props;
    const form = useCreateConstantForm(props);

    return (
        <ConfirmationDialog
            open={open}
            title={i18n.t("Create new constant")}
            cancelText={i18n.t("Cancel")}
            saveText={i18n.t("Save")}
            disableSave={form.disableSave}
            onClose={onClose}
            onCancel={onClose}
            onSave={form.onSave}
            fullWidth
            maxWidth="sm"
        >
            <Form>
                {!canCreate && (
                    <ErrorMessage>
                        {i18n.t(
                            "You do not have permission to create constants. Ask your administrator for the F_CONSTANT_ADD authority."
                        )}
                    </ErrorMessage>
                )}
                {form.generalError && <ErrorMessage>{form.generalError}</ErrorMessage>}

                <TextField
                    label={i18n.t("Name")}
                    value={form.name}
                    onChange={event => form.onNameChange(event.target.value)}
                    error={Boolean(form.fieldErrors.name)}
                    helperText={form.fieldErrors.name}
                    required
                    fullWidth
                    disabled={!canCreate || form.isSaving}
                />
                <TextField
                    label={i18n.t("Short name")}
                    value={form.shortName}
                    onChange={event => form.onShortNameChange(event.target.value)}
                    error={Boolean(form.fieldErrors.shortName)}
                    helperText={
                        form.fieldErrors.shortName ??
                        i18n.t("Auto-filled from name. Max {{max}} characters.", { max: shortNameMaxLength })
                    }
                    required
                    fullWidth
                    inputProps={{ maxLength: shortNameMaxLength }}
                    disabled={!canCreate || form.isSaving}
                />
                <TextField
                    label={i18n.t("Code")}
                    value={form.code}
                    onChange={event => form.onCodeChange(event.target.value)}
                    error={Boolean(form.fieldErrors.code)}
                    helperText={
                        form.fieldErrors.code ??
                        (prefix
                            ? i18n.t("Auto-filled with the project prefix {{prefix}}", { prefix })
                            : i18n.t("Auto-filled from name"))
                    }
                    required
                    fullWidth
                    disabled={!canCreate || form.isSaving}
                />
                <TextField
                    label={i18n.t("Description")}
                    value={form.description}
                    onChange={event => form.onDescriptionChange(event.target.value)}
                    error={Boolean(form.fieldErrors.description)}
                    helperText={form.fieldErrors.description}
                    required
                    multiline
                    minRows={2}
                    fullWidth
                    disabled={!canCreate || form.isSaving}
                />
            </Form>
        </ConfirmationDialog>
    );
});

const Form = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem 0;
`;

const ErrorMessage = styled.div`
    padding: 0.5rem 1rem;
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ef9a9a;
    border-radius: 4px;
    font-size: 0.875rem;
`;
