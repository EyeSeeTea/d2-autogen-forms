import React, { useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import MonacoEditor, { Monaco, loader } from "@monaco-editor/react";
import { CircularProgress } from "material-ui";
import { autogenConfigSchema } from "./schemas";
import { useJsonProcessor } from "./hooks/useJsonProcessor";
import { Code } from "../../../domain/common/entities/Base";
import i18n from "../../../locales";
import { DEFAULT_JSON_VALUE } from "./hooks/useConfigurator";
import { useAutogenEditor } from "./hooks/useAutogenEditor";

export type EditorProps = {
    dataSetCode: Code;
    configValue: string;
    updateConfigValue: (value: string) => void;
    updateJsonValidity: (isValid: boolean) => void;
};

export const Editor: React.FC<EditorProps> = React.memo(props => {
    const { dataSetCode, configValue } = props;

    const valueGetter = useRef<Monaco>();

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
            })
            .catch(error => console.error("Monaco initialization error:", error));
    }, [dataSetCode, isLargeFile]);

    const handleEditorBeforeMount = useCallback((_valueGetter: Monaco) => {
        valueGetter.current = _valueGetter;
    }, []);

    if (error) return <ErrorContainer>{i18n.t(`Processing Error: {{error}}`, { error: error })}</ErrorContainer>;

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
                height="80vh"
                width="60vw"
                language="json"
                defaultLanguage="json"
                defaultValue={DEFAULT_JSON_VALUE}
                value={configValue}
                onChange={value => {
                    if (value) handleChange(value);
                }}
                options={editorOptions}
                onValidate={handleEditorValidation}
                beforeMount={handleEditorBeforeMount}
                onMount={handleEditorDidMount}
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
    margin-bottom: 16px;
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
