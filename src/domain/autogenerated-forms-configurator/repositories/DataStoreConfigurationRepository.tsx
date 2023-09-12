import { DataSet } from "../entities/DataSet";

export interface DataStoreConfigurationRepository {
    getFormConfig(namespace: string): Promise<any>;
    saveFormConfig(namespace: string, config: any): Promise<void>;
    getDatasets(): Promise<DataSet[]>;
}
