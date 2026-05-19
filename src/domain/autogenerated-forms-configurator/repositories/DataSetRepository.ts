import { Id } from "../../common/entities/Base";
import { DataSet } from "../entities/DataSet";

export interface DataSetRepository {
    get(): Promise<DataSet[]>;
    getById(id: Id): Promise<DataSet>;
}
