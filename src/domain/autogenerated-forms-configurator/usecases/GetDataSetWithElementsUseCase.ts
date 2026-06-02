import { Id } from "../../common/entities/Base";
import { DataSetDetail } from "../entities/DataSet";
import { DataSetRepository } from "../repositories/DataSetRepository";

export class GetDataSetWithElementsUseCase {
    constructor(private dataSetRepository: DataSetRepository) {}

    execute(id: Id): Promise<DataSetDetail> {
        return this.dataSetRepository.getWithElements(id);
    }
}
