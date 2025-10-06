import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useJsonProcessor } from "./useJsonProcessor";
import { AutogenConfig } from "../../../../domain/common/entities/AutogenConfig";
import { CodedRef } from "../../../../domain/common/entities/Base";

export type DataSetViewModel = CodedRef;

type ConfiguratorState = {
    configValue: string;
    dataSet: DataSetViewModel;
    disableSave: boolean;
    newDataSet: DataSetViewModel;
    clearConfig: () => void;
    createNewConfig: (dataSet: DataSetViewModel) => void;
    deleteConfig: (dataSet: DataSetViewModel) => void;
    saveConfig: () => Promise<void>;
    updateConfigValue: (value: string) => void;
    updateDataSet: (dataSet: DataSetViewModel) => void;
    updateJsonValidity: (isValid: boolean) => void;
    updateNewDataSet: (dataSet: DataSetViewModel) => void;
};

// TO DO: add snackbar notifications
// TO DO: loading states
// TO DO: separate hook files, maybe one for configurator actions
// TO DO: unit tests
// TO DO: use cases for each action
// TO DO: alphabetical order for config value

export function useConfigurator(): ConfiguratorState {
    const { compositionRoot } = useAppContext();
    const { formatJson, parseJson } = useJsonProcessor();

    const [configValue, updateConfigValue] = useState<string>(DEFAULT_JSON_VALUE);
    const [isJSONValid, updateJsonValidity] = useState<boolean>(false);
    const [dataSet, updateDataSet] = useState<DataSetViewModel>(emptyDataSetViewModel);
    const [newDataSet, updateNewDataSet] = useState<DataSetViewModel>(emptyDataSetViewModel);

    useEffect(() => {
        if (!dataSet.code) return;

        compositionRoot.dataStoreConfig.getFormConfig(dataSet.code).then(async config => {
            const formattedConfig = await formatJson(config);
            updateConfigValue(formattedConfig);
        });
    }, [compositionRoot.dataStoreConfig, dataSet, formatJson]);

    const clearConfig = useCallback(() => {
        updateConfigValue(DEFAULT_JSON_VALUE);
        updateJsonValidity(false);
    }, []);

    const createNewConfig = useCallback(
        (dataSet: DataSetViewModel) => {
            const newConfig: AutogenConfig = {
                dataSets: {
                    [dataSet.code]: {},
                },
            };
            const formattedConfig = JSON.stringify(newConfig, null, 4);

            compositionRoot.dataStoreConfig.saveFormConfig(dataSet.code, newConfig).then(() => {
                updateDataSet(dataSet);
                updateConfigValue(formattedConfig);
                updateJsonValidity(true);
            });
        },
        [compositionRoot.dataStoreConfig]
    );

    const deleteConfig = useCallback(
        (dataSet: DataSetViewModel) => {
            compositionRoot.dataStoreConfig.deleteFormConfig(dataSet.code).then(() => {
                updateDataSet(emptyDataSetViewModel);
                clearConfig();
            });
        },
        [compositionRoot.dataStoreConfig, clearConfig]
    );

    const saveConfig = useCallback(async () => {
        if (!dataSet) return;

        const parsedConfig = await parseJson(configValue);
        await compositionRoot.dataStoreConfig.saveFormConfig(dataSet.code, parsedConfig);
    }, [compositionRoot.dataStoreConfig, dataSet, configValue, parseJson]);

    const disableSave = useMemo(() => !dataSet || !isJSONValid || !configValue, [dataSet, isJSONValid, configValue]);

    return {
        configValue: configValue,
        dataSet: dataSet,
        disableSave: disableSave,
        newDataSet: newDataSet,
        clearConfig: clearConfig,
        createNewConfig: createNewConfig,
        deleteConfig: deleteConfig,
        saveConfig: saveConfig,
        updateDataSet: updateDataSet,
        updateConfigValue: updateConfigValue,
        updateJsonValidity: updateJsonValidity,
        updateNewDataSet: updateNewDataSet,
    };
}

export const DEFAULT_JSON_VALUE = "{}";
const emptyDataSetViewModel: DataSetViewModel = { code: "", name: "" };
