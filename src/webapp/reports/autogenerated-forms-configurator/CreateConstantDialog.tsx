import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { TextField } from "@material-ui/core";
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { Constant, deriveCode, deriveShortName, shortNameMaxLength } from "../../../domain/common/entities/Constant";
import { ConstantSaveError } from "../../../domain/common/entities/ConstantSaveError";
import { useAppContext } from "../../contexts/app-context";

type CreateConstantDialogProps = {
    open: boolean;
    prefix: string;
    canCreate: boolean;
    onClose: () => void;
    onSuccess: (code: string) => void;
};

export const CreateConstantDialog: React.FC<CreateConstantDialogProps> = React.memo(props => {
    const { open, prefix, canCreate, onClose, onSuccess } = props;
    const { compositionRoot } = useAppContext();

    const [name, setName] = useState("");
    const [shortName, setShortName] = useState("");
    const [shortNameDirty, setShortNameDirty] = useState(false);
    const [code, setCode] = useState("");
    const [codeDirty, setCodeDirty] = useState(false);
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [generalError, setGeneralError] = useState<string | undefined>();
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<"name" | "shortName" | "code" | "description", string>>
    >({});

    useEffect(() => {
        if (!open) {
            setName("");
            setShortName("");
            setShortNameDirty(false);
            setCode("");
            setCodeDirty(false);
            setDescription("");
            setIsSaving(false);
            setGeneralError(undefined);
            setFieldErrors({});
        }
    }, [open]);

    const handleNameChange = useCallback(
        (nextName: string) => {
            setName(nextName);
            if (!shortNameDirty) setShortName(deriveShortName(nextName));
            if (!codeDirty) setCode(deriveCode(nextName, prefix));
        },
        [shortNameDirty, codeDirty, prefix]
    );

    const handleShortNameChange = useCallback((nextShortName: string) => {
        setShortNameDirty(true);
        setShortName(nextShortName);
    }, []);

    const handleCodeChange = useCallback((nextCode: string) => {
        setCodeDirty(true);
        setCode(nextCode);
    }, []);

    const validate = useCallback((): boolean => {
        const errors: typeof fieldErrors = {};
        if (!name.trim()) errors.name = i18n.t("Name is required");
        if (!shortName.trim()) errors.shortName = i18n.t("Short name is required");
        else if (shortName.length > shortNameMaxLength)
            errors.shortName = i18n.t("Short name must be {{max}} characters or fewer", { max: shortNameMaxLength });
        if (!code.trim()) errors.code = i18n.t("Code is required");
        if (!description.trim()) errors.description = i18n.t("Description is required");
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [name, shortName, code, description]);

    const handleSave = useCallback(async () => {
        setGeneralError(undefined);
        if (!validate()) return;

        const constant: Constant = {
            id: "",
            name: name.trim(),
            shortName: shortName.trim(),
            code: code.trim(),
            description: description.trim(),
            value: 0,
            translations: [],
        };

        setIsSaving(true);
        try {
            await compositionRoot.constants.create(constant);
            onSuccess(constant.code);
        } catch (error) {
            if (error instanceof ConstantSaveError) {
                const fieldUpdates: typeof fieldErrors = {};
                for (const field of ["name", "shortName", "code", "description"] as const) {
                    const fieldMessage = error.fieldError(field);
                    if (fieldMessage) fieldUpdates[field] = fieldMessage;
                }
                if (Object.keys(fieldUpdates).length > 0) {
                    setFieldErrors(prev => ({ ...prev, ...fieldUpdates }));
                } else {
                    setGeneralError(error.message);
                }
            } else {
                setGeneralError(error instanceof Error ? error.message : String(error));
            }
        } finally {
            setIsSaving(false);
        }
    }, [validate, name, shortName, code, description, compositionRoot.constants, onSuccess]);

    const disableSave = useMemo(() => !canCreate || isSaving, [canCreate, isSaving]);

    return (
        <ConfirmationDialog
            open={open}
            title={i18n.t("Create new constant")}
            cancelText={i18n.t("Cancel")}
            saveText={i18n.t("Save")}
            disableSave={disableSave}
            onClose={onClose}
            onCancel={onClose}
            onSave={handleSave}
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
                {generalError && <ErrorMessage>{generalError}</ErrorMessage>}

                <TextField
                    label={i18n.t("Name")}
                    value={name}
                    onChange={event => handleNameChange(event.target.value)}
                    error={Boolean(fieldErrors.name)}
                    helperText={fieldErrors.name}
                    required
                    fullWidth
                    disabled={!canCreate || isSaving}
                />
                <TextField
                    label={i18n.t("Short name")}
                    value={shortName}
                    onChange={event => handleShortNameChange(event.target.value)}
                    error={Boolean(fieldErrors.shortName)}
                    helperText={
                        fieldErrors.shortName ??
                        i18n.t("Auto-filled from name. Max {{max}} characters.", { max: shortNameMaxLength })
                    }
                    required
                    fullWidth
                    inputProps={{ maxLength: shortNameMaxLength }}
                    disabled={!canCreate || isSaving}
                />
                <TextField
                    label={i18n.t("Code")}
                    value={code}
                    onChange={event => handleCodeChange(event.target.value)}
                    error={Boolean(fieldErrors.code)}
                    helperText={
                        fieldErrors.code ??
                        (prefix
                            ? i18n.t("Auto-filled with the project prefix {{prefix}}", { prefix })
                            : i18n.t("Auto-filled from name"))
                    }
                    required
                    fullWidth
                    disabled={!canCreate || isSaving}
                />
                <TextField
                    label={i18n.t("Description")}
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    error={Boolean(fieldErrors.description)}
                    helperText={fieldErrors.description}
                    required
                    multiline
                    minRows={2}
                    fullWidth
                    disabled={!canCreate || isSaving}
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
