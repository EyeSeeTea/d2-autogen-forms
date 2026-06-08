import { DataSet } from "../entities/DataSet";
import { DataSetRepository } from "../repositories/DataSetRepository";

export class SaveDataSetUseCase {
    constructor(private dataSetRepository: DataSetRepository) {}

    execute(dataSet: DataSet): Promise<void> {
        if (dataSet.sections.length > 0) return Promise.resolve();
        return this.dataSetRepository.save(dataSet);
    }
}
