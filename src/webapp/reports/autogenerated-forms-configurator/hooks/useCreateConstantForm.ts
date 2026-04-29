import { useCallback, useEffect, useState } from "react";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { Constant, deriveCode, deriveShortName, shortNameMaxLength } from "../../../../domain/common/entities/Constant";
import { ConstantField, fieldError, isConstantSaveError } from "../../../../domain/common/entities/ConstantSaveError";
import { Maybe } from "../../../../utils/ts-utils";
import { useAppContext } from "../../../contexts/app-context";

export type CreateConstantFormProps = {
    open: boolean;
    prefix: string;
    canCreate: boolean;
    onSuccess: (code: string) => void;
};

export type CreateConstantFormState = {
    name: string;
    shortName: string;
    code: string;
    description: string;
    fieldErrors: Partial<Record<ConstantField, string>>;
    generalError: Maybe<string>;
    isSaving: boolean;
    disableSave: boolean;
    onNameChange: (value: string) => void;
    onShortNameChange: (value: string) => void;
    onCodeChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onSave: () => Promise<void>;
};

export function useCreateConstantForm(props: CreateConstantFormProps): CreateConstantFormState {
    const { open, prefix, canCreate, onSuccess } = props;
    const { compositionRoot } = useAppContext();

    const [name, setName] = useState("");
    const [shortName, setShortName] = useState("");
    const [shortNameDirty, setShortNameDirty] = useState(false);
    const [code, setCode] = useState("");
    const [codeDirty, setCodeDirty] = useState(false);
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [generalError, setGeneralError] = useState<Maybe<string>>();
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<ConstantField, string>>>({});

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

    const onNameChange = useCallback(
        (next: string) => {
            setName(next);
            if (!shortNameDirty) setShortName(deriveShortName(next));
            if (!codeDirty) setCode(deriveCode(next, prefix));
        },
        [shortNameDirty, codeDirty, prefix]
    );

    const onShortNameChange = useCallback((next: string) => {
        setShortNameDirty(true);
        setShortName(next);
    }, []);

    const onCodeChange = useCallback((next: string) => {
        setCodeDirty(true);
        setCode(next);
    }, []);

    const onDescriptionChange = useCallback((next: string) => {
        setDescription(next);
    }, []);

    const validate = useCallback((): boolean => {
        const messages: Record<ConstantField, Maybe<string>> = {
            name: name.trim() ? undefined : i18n.t("Name is required"),
            shortName: !shortName.trim()
                ? i18n.t("Short name is required")
                : shortName.length > shortNameMaxLength
                ? i18n.t("Short name must be {{max}} characters or fewer", { max: shortNameMaxLength })
                : undefined,
            code: code.trim() ? undefined : i18n.t("Code is required"),
            description: description.trim() ? undefined : i18n.t("Description is required"),
        };
        const errors = Object.fromEntries(
            Object.entries(messages).filter(([, value]) => value !== undefined)
        ) as Partial<Record<ConstantField, string>>;
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [name, shortName, code, description]);

    const onSave = useCallback(async () => {
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
            if (isConstantSaveError(error)) {
                const saveError = error;
                const fields: ReadonlyArray<ConstantField> = ["name", "shortName", "code", "description"];
                const fieldUpdates = Object.fromEntries(
                    fields
                        .map(field => [field, fieldError(saveError, field)] as const)
                        .filter(([, message]) => message !== undefined)
                );
                if (Object.keys(fieldUpdates).length > 0) {
                    setFieldErrors(prev => ({ ...prev, ...fieldUpdates }));
                } else {
                    setGeneralError(saveError.message);
                }
            } else {
                setGeneralError(error instanceof Error ? error.message : String(error));
            }
        } finally {
            setIsSaving(false);
        }
    }, [validate, name, shortName, code, description, compositionRoot.constants, onSuccess]);

    return {
        name,
        shortName,
        code,
        description,
        fieldErrors,
        generalError,
        isSaving,
        disableSave: !canCreate || isSaving,
        onNameChange,
        onShortNameChange,
        onCodeChange,
        onDescriptionChange,
        onSave,
    };
}
