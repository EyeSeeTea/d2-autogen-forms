import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useJsonProcessor } from "./useJsonProcessor";
import { AutogenConfig } from "../../../../domain/common/entities/AutogenConfig";

type ConfiguratorState = {
    configValue: string;
    dataSetCode: string;
    disableSave: boolean;
    newDataSetCode: string;
    clearConfig: () => void;
    createNewConfig: (dataSetCode: string) => void;
    saveConfig: () => Promise<void>;
    updateConfigValue: (value: string) => void;
    updateDataSetCode: (dataSetCode: string) => void;
    updateJsonValidity: (isValid: boolean) => void;
    updateNewDataSet: (dataSetCode: string) => void;
};

export function useConfigurator(): ConfiguratorState {
    const { compositionRoot } = useAppContext();
    const { formatJson, parseJson } = useJsonProcessor();

    const [configValue, updateConfigValue] = useState<string>(DEFAULT_JSON_VALUE);
    const [isJSONValid, updateJsonValidity] = useState<boolean>(false);
    const [dataSetCode, updateDataSetCode] = useState<string>("");
    const [newDataSetCode, updateNewDataSet] = useState<string>("");

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

    const createNewConfig = useCallback(
        dataSetCode => {
            const newConfig: AutogenConfig = {
                dataSets: {
                    [dataSetCode]: {},
                },
            };
            const formattedConfig = JSON.stringify(newConfig, null, 4);
            // TO DO: add snackbar notifications
            // TO DO: add delete button
            // TO DO: loading states
            compositionRoot.dataStoreConfig.saveFormConfig(dataSetCode, newConfig).then(() => {
                updateDataSetCode(dataSetCode);
                updateConfigValue(formattedConfig);
                updateJsonValidity(true);
            });
        },
        [compositionRoot.dataStoreConfig]
    );

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
        dataSetCode: dataSetCode,
        disableSave: disableSave,
        newDataSetCode: newDataSetCode,
        clearConfig: clearConfig,
        createNewConfig: createNewConfig,
        saveConfig: saveConfig,
        updateDataSetCode: updateDataSetCode,
        updateConfigValue: updateConfigValue,
        updateJsonValidity: updateJsonValidity,
        updateNewDataSet: updateNewDataSet,
    };
}

export const DEFAULT_JSON_VALUE = "{}";
