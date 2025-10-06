import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useJsonProcessor } from "./useJsonProcessor";
import { AutogenConfig } from "../../../../domain/common/entities/AutogenConfig";
import { CodedRef } from "../../../../domain/common/entities/Base";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/d2-ui-components/locales";

export type DataSetViewModel = CodedRef;

type ConfiguratorState = {
    configValue: string;
    dataSet: DataSetViewModel;
    disableSave: boolean;
    isLoading: boolean;
    newDataSet: DataSetViewModel;
    clearConfig: () => void;
    createNewConfig: (dataSet: DataSetViewModel) => void;
    deleteConfig: (dataSet: DataSetViewModel) => void;
    saveConfig: () => Promise<void>;
    updateConfigValue: (value: string) => void;
    updateDataSet: (dataSet: DataSetViewModel) => void;
    updateJsonValidity: (isValid: boolean) => void;
    updateLoadingState: (isLoading: boolean) => void;
    updateNewDataSet: (dataSet: DataSetViewModel) => void;
};

// TO DO: separate hook files, maybe one for configurator actions
// TO DO: unit tests
// TO DO: alphabetical order for config value

export function useConfigurator(): ConfiguratorState {
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const { formatJson, parseJson } = useJsonProcessor();

    const [isLoading, updateLoadingState] = useState(false);
    const [configValue, updateConfigValue] = useState<string>(DEFAULT_JSON_VALUE);
    const [isJSONValid, updateJsonValidity] = useState<boolean>(false);
    const [dataSet, updateDataSet] = useState<DataSetViewModel>(emptyDataSetViewModel);
    const [newDataSet, updateNewDataSet] = useState<DataSetViewModel>(emptyDataSetViewModel);

    useEffect(() => {
        if (!dataSet.code) return;

        updateLoadingState(true);
        compositionRoot.dataStoreConfig
            .getFormConfig(dataSet.code)
            .then(async config => {
                const formattedConfig = await formatJson(config);
                updateConfigValue(formattedConfig);
            })
            .finally(() => updateLoadingState(false));
    }, [compositionRoot.dataStoreConfig, dataSet, formatJson]);

    const clearConfig = useCallback(() => {
        updateConfigValue(DEFAULT_JSON_VALUE);
        updateJsonValidity(false);
    }, []);

    const createNewConfig = useCallback(
        (dataSet: DataSetViewModel) => {
            updateLoadingState(true);
            const newConfig: AutogenConfig = {
                dataSets: {
                    [dataSet.code]: {},
                },
            };
            const formattedConfig = JSON.stringify(newConfig, null, 4);

            compositionRoot.dataStoreConfig
                .saveFormConfig(dataSet.code, newConfig)
                .then(() => {
                    updateDataSet(dataSet);
                    updateConfigValue(formattedConfig);
                    updateJsonValidity(true);
                    snackbar.success(i18n.t("New configuration created"));
                })
                .catch(error => snackbar.error(error.message))
                .finally(() => updateLoadingState(false));
        },
        [compositionRoot.dataStoreConfig, snackbar]
    );

    const deleteConfig = useCallback(
        (dataSet: DataSetViewModel) => {
            updateLoadingState(true);

            compositionRoot.dataStoreConfig
                .deleteFormConfig(dataSet.code)
                .then(() => {
                    updateDataSet(emptyDataSetViewModel);
                    clearConfig();
                    snackbar.success(i18n.t("Configuration deleted"));
                })
                .catch(error => snackbar.error(error.message))
                .finally(() => updateLoadingState(false));
        },
        [compositionRoot.dataStoreConfig, clearConfig, snackbar]
    );

    const saveConfig = useCallback(async () => {
        if (!dataSet) return;

        updateLoadingState(true);
        const parsedConfig = await parseJson(configValue);
        await compositionRoot.dataStoreConfig
            .saveFormConfig(dataSet.code, parsedConfig)
            .then(() => snackbar.success(i18n.t("Configuration saved")))
            .catch(error => snackbar.error(error.message))
            .finally(() => updateLoadingState(false));
    }, [dataSet, parseJson, configValue, compositionRoot.dataStoreConfig, snackbar]);

    const disableSave = useMemo(() => !dataSet || !isJSONValid || !configValue, [dataSet, isJSONValid, configValue]);

    return {
        configValue: configValue,
        dataSet: dataSet,
        disableSave: disableSave,
        isLoading: isLoading,
        newDataSet: newDataSet,
        clearConfig: clearConfig,
        createNewConfig: createNewConfig,
        deleteConfig: deleteConfig,
        saveConfig: saveConfig,
        updateDataSet: updateDataSet,
        updateConfigValue: updateConfigValue,
        updateJsonValidity: updateJsonValidity,
        updateLoadingState: updateLoadingState,
        updateNewDataSet: updateNewDataSet,
    };
}

export const DEFAULT_JSON_VALUE = "{}";
const emptyDataSetViewModel: DataSetViewModel = { code: "", name: "" };
