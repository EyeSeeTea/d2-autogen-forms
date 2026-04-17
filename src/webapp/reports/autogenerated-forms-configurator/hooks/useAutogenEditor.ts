import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Monaco } from "@monaco-editor/react";
import { EditorProps } from "../Editor";
import { useJsonProcessor } from "./useJsonProcessor";
import { DEFAULT_JSON_VALUE } from "./useConfigurator";
import { Maybe } from "../../../../utils/ts-utils";

type Marker = Record<string, unknown>;
type AutogenEditorProps = Omit<EditorProps, "dataSetCode"> & {
    isProcessing: boolean;
    error: Maybe<string>;
};
type AutogenEditorState = {
    editorOptions: Monaco["options"];
    isLargeFile: boolean;
    handleChange: (value: Maybe<string>) => void;
    handleEditorDidMount: (editor: Monaco["editor"], monaco: Monaco) => void;
    handleEditorValidation: (markers: Marker[]) => void;
    processingError: Maybe<string>;
};

export function useAutogenEditor(props: AutogenEditorProps): AutogenEditorState {
    const { configValue, error: processingError, isProcessing, updateJsonValidity, updateConfigValue } = props;
    const { validateJson } = useJsonProcessor();

    const [isLargeFile, setIsLargeFile] = useState(false);
    const [validationDebounceMs, setValidationDebounceMs] = useState(300);

    const validationTimeoutRef = useRef<number>();
    const lastValidationRef = useRef<string>("");
    const isValidatingRef = useRef<boolean>(false);

    const fileSize = useMemo(() => calculateFileSizeInKB(configValue), [configValue]);
    const isHugeFile = useMemo(() => fileSize > HUGE_FILE_SIZE, [fileSize]);

    useEffect(() => {
        const isLarge = fileSize > LARGE_FILE_SIZE;

        setIsLargeFile(isLarge);
        setValidationDebounceMs(isHugeFile ? 2000 : isLarge ? 1000 : 300);
    }, [isHugeFile, fileSize]);

    const editorOptions = useMemo(
        () => ({
            selectOnLineNumbers: true,
            automaticLayout: true,
            minimap: { enabled: isLargeFile && !isHugeFile },
            wordWrap: "on" as const,
            scrollBeyondLastLine: false,
            folding: !isHugeFile,
            lineNumbers: "on" as const,
            renderWhitespace: isLargeFile ? ("none" as const) : ("selection" as const),
            quickSuggestions: { other: true, comments: false, strings: true },
            ...(isHugeFile && {
                renderValidationDecorations: "off" as const,
                occurrencesHighlight: false,
                selectionHighlight: false,
                renderLineHighlight: "none" as const,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                scrollbar: {
                    vertical: "auto" as const,
                    horizontal: "auto" as const,
                },
            }),
            ...(isLargeFile &&
                !isHugeFile && {
                    renderValidationDecorations: "warning" as const,
                    occurrencesHighlight: false,
                }),
        }),
        [isLargeFile, isHugeFile]
    );

    const performValidation = useCallback(
        async (jsonContent: string) => {
            if (isValidatingRef.current || lastValidationRef.current === jsonContent) {
                return;
            }

            isValidatingRef.current = true;
            lastValidationRef.current = jsonContent;

            try {
                if (!jsonContent.trim()) {
                    updateJsonValidity(true);
                    return;
                }

                if (jsonContent.length > LARGE_FILE_SIZE) {
                    try {
                        JSON.parse(jsonContent);
                        updateJsonValidity(true);
                    } catch {
                        updateJsonValidity(false);
                    }
                } else {
                    const isValid = await validateJson(jsonContent);
                    updateJsonValidity(isValid);
                }
            } catch (error) {
                console.error("Validation error:", error);
                updateJsonValidity(false);
            } finally {
                isValidatingRef.current = false;
            }
        },
        [validateJson, updateJsonValidity]
    );

    const handleChange = useCallback(
        (value: Maybe<string>) => {
            if (!value?.trim()) {
                updateConfigValue(DEFAULT_JSON_VALUE);
                updateJsonValidity(true);
                return;
            }
            updateConfigValue(value);

            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }

            validationTimeoutRef.current = window.setTimeout(() => {
                if (!isProcessing && !isValidatingRef.current) {
                    performValidation(value);
                }
            }, validationDebounceMs);
        },
        [updateConfigValue, validationDebounceMs, isProcessing, performValidation, updateJsonValidity]
    );

    const handleEditorDidMount = useCallback(
        (editor: Monaco["editor"], monaco: Monaco) => {
            if (isLargeFile) {
                editor.updateOptions({
                    smoothScrolling: false,
                    cursorBlinking: "solid",
                    cursorSmoothCaretAnimation: false,
                });
            }

            const fileSize = configValue?.length || 0;
            if (fileSize < HUGE_FILE_SIZE) {
                editor.onKeyUp((e: { keyCode: number }) => {
                    try {
                        const position = editor.getPosition();
                        if (position) {
                            const model = editor.getModel();
                            if (model) {
                                const text = model.getLineContent(position.lineNumber).trim();
                                if (e.keyCode === monaco.KeyCode.Enter && !text) {
                                    editor.trigger("", "editor.action.triggerSuggest", "");
                                }
                            }
                        }
                    } catch (error) {
                        console.warn("Auto-suggest error:", error);
                    }
                });
            }

            let validationThrottle: number;
            editor.onDidChangeModelContent(() => {
                if (validationThrottle) clearTimeout(validationThrottle);

                validationThrottle = window.setTimeout(() => {
                    try {
                        if (!isLargeFile && !isValidatingRef.current) {
                            const markers = monaco.editor.getModelMarkers({});
                            updateJsonValidity(markers.length === 0);
                        }
                    } catch (error) {
                        console.warn("Monaco validation error:", error);
                    }
                }, validationDebounceMs);
            });
        },
        [isLargeFile, configValue?.length, validationDebounceMs, updateJsonValidity]
    );

    const handleEditorValidation = useCallback(
        (markers: Marker[]) => {
            try {
                if (!isLargeFile && !isProcessing && !isValidatingRef.current) {
                    const isValid = markers.length === 0;
                    updateJsonValidity(isValid);
                }
            } catch (error) {
                console.warn("Editor validation error:", error);
            }
        },
        [updateJsonValidity, isLargeFile, isProcessing]
    );

    useEffect(() => {
        return () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
            isValidatingRef.current = false;
        };
    }, []);

    return {
        editorOptions,
        isLargeFile,
        handleChange,
        handleEditorDidMount,
        handleEditorValidation,
        processingError,
    };
}

const LARGE_FILE_SIZE = 100; // 100KB
const HUGE_FILE_SIZE = 500; // 500KB

function calculateFileSizeInKB(input: string): number {
    const encoder = new TextEncoder();
    const sizeInBytes = encoder.encode(input).length;
    const sizeInKB = sizeInBytes / 1024;

    return sizeInKB;
}
