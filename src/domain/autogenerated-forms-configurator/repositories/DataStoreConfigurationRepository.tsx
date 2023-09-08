import { DataSet } from "../entities/DataSet";

export interface DataStoreConfigurationRepository {
    getFormConfig(namespace: string): Promise<any>;
    getDatasets(): Promise<DataSet[]>;
}
