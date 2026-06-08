import { Id } from "../../common/entities/Base";
import { DataSet } from "../entities/DataSet";
import { DataSetRepository } from "../repositories/DataSetRepository";

export class GetDataSetUseCase {
    constructor(private dataSetRepository: DataSetRepository) {}

    execute(id: Id): Promise<DataSet> {
        return this.dataSetRepository.getById(id);
    }
}
