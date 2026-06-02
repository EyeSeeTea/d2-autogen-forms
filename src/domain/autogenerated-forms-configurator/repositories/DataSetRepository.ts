import { Id } from "../../common/entities/Base";
import { DataElementRef, DataSet, DataSetDetail } from "../entities/DataSet";

export interface DataSetRepository {
    get(): Promise<DataSet[]>;
    getById(id: Id): Promise<DataSet>;
    getWithElements(id: Id): Promise<DataSetDetail>;
    createDefaultSection(dataSetId: Id, dataElements: DataElementRef[]): Promise<void>;
}
