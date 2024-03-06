import { DataSet } from "../entities/DataSet";

export interface DataSetRepository {
    get(): Promise<DataSet[]>;
}
