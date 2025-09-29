import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useJsonProcessor } from "./useJsonProcessor";

type ConfiguratorState = {
    configValue: string;
    disableSave: boolean;
    clearConfig: () => void;
    saveConfig: () => Promise<void>;
    updateConfigValue: (value: string) => void;
    updateJsonValidity: (isValid: boolean) => void;
};

export function useConfigurator(dataSetCode: string): ConfiguratorState {
    const { compositionRoot } = useAppContext();
    const { formatJson, parseJson } = useJsonProcessor();

    const [configValue, updateConfigValue] = useState<string>(DEFAULT_JSON_VALUE);
    const [isJSONValid, updateJsonValidity] = useState<boolean>(false);

    useEffect(() => {
        if (dataSetCode !== "") {
            compositionRoot.dataStoreConfig.getFormConfig(dataSetCode).then(async config => {
                const formattedConfig = await formatJson(config);
                updateConfigValue(formattedConfig);
            });
        }
    }, [compositionRoot.dataStoreConfig, dataSetCode, formatJson]);

    const clearConfig = useCallback(() => {
        updateConfigValue(DEFAULT_JSON_VALUE);
        updateJsonValidity(false);
    }, []);

    const saveConfig = useCallback(async () => {
        const parsedConfig = await parseJson(configValue);
        await compositionRoot.dataStoreConfig.saveFormConfig(dataSetCode, parsedConfig);
    }, [compositionRoot.dataStoreConfig, dataSetCode, configValue, parseJson]);

    const disableSave = useMemo(
        () => !dataSetCode || !isJSONValid || !configValue,
        [dataSetCode, isJSONValid, configValue]
    );

    return {
        configValue: configValue,
        disableSave: disableSave,
        clearConfig: clearConfig,
        saveConfig: saveConfig,
        updateConfigValue: updateConfigValue,
        updateJsonValidity: updateJsonValidity,
    };
}

export const DEFAULT_JSON_VALUE = "{}";
