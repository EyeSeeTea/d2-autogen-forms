import { DataSet } from "../entities/DataSet";

export interface DataStoreConfigurationRepository {
    getDatasets(): Promise<DataSet[]>;
}
