import { DataSet } from "../entities/DataSet";
import { DataSetRepository } from "../repositories/DataSetRepository";

export class SaveDataSetUseCase {
    constructor(private dataSetRepository: DataSetRepository) {}

    execute(dataSet: DataSet): Promise<void> {
        return this.dataSetRepository.save(dataSet);
    }
}
