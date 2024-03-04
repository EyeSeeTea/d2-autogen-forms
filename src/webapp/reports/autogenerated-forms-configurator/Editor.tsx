import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import MonacoEditor, { Monaco, loader } from "@monaco-editor/react";
import { CircularProgress } from "material-ui";
import { getAutogenConfigSchema } from "./schemas";
import { useAutogenSchema } from "./useAutogenSchema";
import { Code } from "../../../domain/common/entities/Base";

interface EditorProps {
    dataSetCode: Code;
    json: string | undefined;
    onChange: React.Dispatch<React.SetStateAction<string | undefined>>;
    onValidate: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Marker {
    [key: string]: unknown;
}

export const Editor: React.FC<EditorProps> = React.memo(props => {
    const { dataSetCode, json, onChange, onValidate } = props;
    const autogenConfigSchema = useAutogenSchema(dataSetCode);

    const valueGetter = useRef();

    useEffect(() => {
        loader
            .init()
            .then((monaco: Monaco) => {
                monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                    validate: true,
                    schemas: [getAutogenConfigSchema({ ...autogenConfigSchema, dataSetCode: dataSetCode })],
                });
            })
            .catch(error => console.error("An error occurred during initialization of the editor: ", error));
    }, [autogenConfigSchema, dataSetCode]);

    function handleEditorBeforeMount(_valueGetter: Monaco) {
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

    function handleEditorValidation(markers: Marker[]) {
        return markers.length === 0 ? onValidate(true) : onValidate(false);
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
