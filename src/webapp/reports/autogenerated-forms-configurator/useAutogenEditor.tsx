import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../../contexts/app-context";

export function useAutogenEditor(dataSetCode: string) {
    const { compositionRoot } = useAppContext();

    const [jsonValue, setJSONValue] = useState<string | undefined>("{}");
    const [isJSONValid, setJsonValidity] = useState<boolean>(false);

    useEffect(() => {
        compositionRoot.dataStoreConfig
            .getFormConfig(dataSetCode)
            .then(config => dataSetCode !== "" && setJSONValue(JSON.stringify(config, null, 4)));
    }, [compositionRoot.dataStoreConfig, dataSetCode]);

    const saveConfig = useCallback(async () => {
        await compositionRoot.dataStoreConfig.saveFormConfig(dataSetCode, JSON.parse(jsonValue ?? ""));
    }, [compositionRoot.dataStoreConfig, dataSetCode, jsonValue]);

    const disableSave = !dataSetCode || !isJSONValid || !jsonValue;

    return {
        disableSave,
        isJSONValid,
        jsonValue,
        saveConfig,
        setJsonValidity,
        setJSONValue,
    };
}
