import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import MonacoEditor, { Monaco, loader } from "@monaco-editor/react";
import { CircularProgress } from "material-ui";
import { getJsonSchema } from "./schemas";

interface EditorProps {
    sections: { id: string; code: string }[];
    dataElements: { id: string; code: string }[];
    dsCode: string;
    json: string | undefined;
    onChange: React.Dispatch<React.SetStateAction<string | undefined>>;
    handleEditorValidation(markers: any): void;
}

export const Editor: React.FC<EditorProps> = React.memo(props => {
    const { dataElements, dsCode, handleEditorValidation, json, onChange, sections } = props;
    const valueGetter = useRef();

    useEffect(() => {
        loader
            .init()
            .then((monaco: Monaco) => {
                const sectionCodes = sections.map(section => section.code);
                const dataElementCodes = dataElements.map(dataElement => dataElement.code);

                monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                    validate: true,
                    schemas: [getJsonSchema(dataElementCodes, sectionCodes, dsCode)],
                });
            })
            .catch(error => console.error("An error occurred during initialization of Monaco: ", error));
    }, [dataElements, dsCode, sections]);

    function handleEditorDidMount(_valueGetter: any) {
        valueGetter.current = _valueGetter;
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
            beforeMount={handleEditorDidMount}
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
