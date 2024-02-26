import { Maybe } from "../../../utils/ts-utils";
import { AutogenConfig } from "../entities/AutogenConfig";
import { DataSet, AutogenConfigSchema } from "../entities/DataSet";

export interface DataStoreConfigurationRepository {
    getFormConfig(namespace: string): Promise<AutogenConfig>;
    saveFormConfig(namespace: string, config: AutogenConfig): Promise<void>;
    getDataSets(): Promise<DataSet[]>;
    getSelectedDataSet(dataSets: DataSet[], dataSetId: Maybe<string>): Promise<AutogenConfigSchema>;
}
