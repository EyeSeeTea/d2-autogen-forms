import { DataSet } from "../entities/DataSet";
import { DataStoreConfigurationRepository } from "../repositories/DataStoreConfigurationRepository";

export class GetSelectedDataSetUseCase {
    constructor(private dataStoreConfigRepository: DataStoreConfigurationRepository) {}

    execute(dataSets: DataSet[], dataSetId: string) {
        return this.dataStoreConfigRepository.getSelectedDataSet(dataSets, dataSetId);
    }
}
