import { DataSetRepository } from "../repositories/DataSetRepository";

export class GetDataSetsUseCase {
    constructor(private dataSetRepository: DataSetRepository) {}

    execute() {
        return this.dataSetRepository.get();
    }
}
