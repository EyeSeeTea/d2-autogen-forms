import { DataStoreConfigurationRepository } from "../repositories/DataStoreConfigurationRepository";

export class GetDataSetsUseCase {
    constructor(private dataStoreConfigRepository: DataStoreConfigurationRepository) {}

    execute() {
        return this.dataStoreConfigRepository.getDatasets();
    }
}
