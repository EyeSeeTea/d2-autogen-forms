import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import MonacoEditor, { Monaco, loader } from "@monaco-editor/react";
import { CircularProgress } from "material-ui";
import { JsonSchemaProps, getJsonSchema } from "./schemas";

interface EditorProps {
    editorCodes: JsonSchemaProps;
    json: string | undefined;
    onChange: React.Dispatch<React.SetStateAction<string | undefined>>;
    handleEditorValidation(markers: any): void;
}

export const Editor: React.FC<EditorProps> = React.memo(props => {
    const { handleEditorValidation, json, onChange, editorCodes } = props;
    const { dataElements, dsCode, sectionCodes, deInSectionCodes, categoryComboCodes } = editorCodes;

    const valueGetter = useRef();

    useEffect(() => {
        loader
            .init()
            .then((monaco: Monaco) => {
                monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                    validate: true,
                    schemas: [
                        getJsonSchema({ dsCode, dataElements, deInSectionCodes, sectionCodes, categoryComboCodes }),
                    ],
                });
            })
            .catch(error => console.error("An error occurred during initialization of Monaco: ", error));
    }, [categoryComboCodes, dataElements, deInSectionCodes, dsCode, sectionCodes]);

    function handleEditorBeforeMount(_valueGetter: any) {
        valueGetter.current = _valueGetter;
    }

    function handleEditorDidMount(editor: any, monaco: Monaco) {
        editor.onKeyUp((e: any) => {
            const position = editor.getPosition();
            const text = editor.getModel().getLineContent(position.lineNumber).trim();
            if (e.keyCode === monaco.KeyCode.Enter && !text) {
                editor.trigger("", "editor.action.triggerSuggest", "");
            }
        });
    }

    return (
        <StyledEditor
            loading={<CircularProgress />}
            height="80vh"
            width="60vw"
            language="json"
            defaultLanguage="json"
            defaultValue="{}"
            value={json}
            onChange={onChange}
            options={{ wordWrap: "on", minimap: { enabled: false } }}
            onValidate={handleEditorValidation}
            beforeMount={handleEditorBeforeMount}
            onMount={handleEditorDidMount}
        />
    );
});

const StyledEditor = styled(MonacoEditor)`
    margin: 40px 0 20px;
    grid-area: auto / 1 / auto / auto;
    padding: 20px;
    border: 1px solid rgb(160, 173, 186);
    border-radius: 3px;
    box-shadow: rgba(48, 54, 60, 0.1) 0px 1px 2px 0px inset;
}
`;
