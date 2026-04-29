import React, { useEffect, useRef, useCallback, useState } from "react";
import styled from "styled-components";
import MonacoEditor, { Monaco, loader } from "@monaco-editor/react";
import { CircularProgress } from "material-ui";
import { autogenConfigSchema } from "./schemas";
import { useJsonProcessor } from "./hooks/useJsonProcessor";
import { Code } from "../../../domain/common/entities/Base";
import i18n from "../../../locales";
import { DEFAULT_JSON_VALUE } from "./hooks/useConfigurator";
import { useAutogenEditor } from "./hooks/useAutogenEditor";
import {
    InlineConstantCompletionsOptions,
    registerInlineConstantCompletions,
} from "./monaco/registerInlineConstantCompletions";
import { CodeEditor, IRange } from "./monaco/types";

export type EditorApi = {
    insertAtRange: (range: IRange, text: string) => void;
};

export type EditorProps = {
    dataSetCode: Code;
    configValue: string;
    updateConfigValue: (value: string) => void;
    updateJsonValidity: (isValid: boolean) => void;
    inlineConstantsOptions?: InlineConstantCompletionsOptions;
    onEditorReady?: (api: EditorApi) => void;
};

export const Editor: React.FC<EditorProps> = React.memo(props => {
    const { dataSetCode, configValue, inlineConstantsOptions, onEditorReady } = props;

    const valueGetter = useRef<Monaco>();
    const [editorInstance, setEditorInstance] = useState<CodeEditor>();
    const [monacoInstance, setMonacoInstance] = useState<Monaco>();

    const { isProcessing, error } = useJsonProcessor();
    const { editorOptions, isLargeFile, handleChange, handleEditorDidMount, handleEditorValidation } = useAutogenEditor(
        { ...props, isProcessing, error }
    );

    useEffect(() => {
        loader
            .init()
            .then((monaco: Monaco) => {
                const diagnosticOptions = {
                    validate: !isLargeFile,
                    schemas: isLargeFile ? [] : [autogenConfigSchema],
                };

                monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticOptions);
                monaco.languages.json.jsonDefaults.setModeConfiguration({
                    documentFormattingEdits: true,
                    documentRangeFormattingEdits: true,
                    completionItems: !isLargeFile,
                    hovers: true,
                    documentSymbols: true,
                    tokens: true,
                    colors: true,
                    foldingRanges: true,
                    diagnostics: !isLargeFile,
                    selectionRanges: true,
                });
            })
            .catch(error => console.error("Monaco initialization error:", error));
    }, [dataSetCode, isLargeFile]);

    const handleEditorBeforeMount = useCallback((_valueGetter: Monaco) => {
        valueGetter.current = _valueGetter;
    }, []);

    const handleMount = useCallback(
        (editor: CodeEditor, monaco: Monaco) => {
            setEditorInstance(editor);
            setMonacoInstance(monaco);
            handleEditorDidMount(editor, monaco);
            onEditorReady?.({
                insertAtRange: (range, text) => {
                    editor.executeEdits("inline-constants", [{ range, text, forceMoveMarkers: true }]);
                    editor.focus();
                },
            });
        },
        [handleEditorDidMount, onEditorReady]
    );

    useEffect(() => {
        if (!editorInstance || !monacoInstance || !inlineConstantsOptions) return;
        const disposer = registerInlineConstantCompletions(editorInstance, monacoInstance, inlineConstantsOptions);
        return () => disposer.dispose();
    }, [editorInstance, monacoInstance, inlineConstantsOptions]);

    if (error)
        return (
            <ErrorContainer>
                {i18n.t(`Processing Error: {{error}}`, { error: error, nsSeparator: false })}
            </ErrorContainer>
        );

    return (
        <EditorContainer>
            {isProcessing && (
                <ProcessingIndicator>
                    <CircularProgress size={20} />
                    <ProcessingText>{i18n.t("Processing large JSON...")}</ProcessingText>
                </ProcessingIndicator>
            )}

            {isLargeFile && (
                <PerformanceWarning>
                    {i18n.t("Large file detected. Some features are disabled for better performance.")}
                </PerformanceWarning>
            )}

            <StyledEditor
                loading={<CircularProgress />}
                height={"70vh"}
                language="json"
                defaultLanguage="json"
                defaultValue={DEFAULT_JSON_VALUE}
                value={configValue}
                onChange={handleChange}
                options={editorOptions}
                onValidate={handleEditorValidation}
                beforeMount={handleEditorBeforeMount}
                onMount={handleMount}
            />
        </EditorContainer>
    );
});

const EditorContainer = styled.div`
    position: relative;
`;

const ProcessingIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-block-end: 16px;
    padding: 8px 16px;
    background-color: #e3f2fd;
    border-radius: 4px;
    border: 1px solid #2196f3;
`;

const ProcessingText = styled.span`
    font-size: 14px;
    color: #1976d2;
`;

const PerformanceWarning = styled.div`
    margin: 1rem 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #fff3e0;
    border-radius: 4px;
    border: 1px solid #ff9800;
    color: #e65100;
    font-size: 14px;
    width: max-content;
`;

const StyledEditor = styled(MonacoEditor)`
    margin: 1.25rem 0;
    padding: 20px;
    border: 1px solid rgb(160, 173, 186);
    border-radius: 3px;
    box-shadow: rgba(48, 54, 60, 0.1) 0px 1px 2px 0px inset;
`;

const ErrorContainer = styled.div`
    color: #f44336;
    padding: 0.5rem 1rem;
    border: 1px solid #f44336;
    border-radius: 4px;
    background-color: #ffebee;
    width: max-content;
`;
