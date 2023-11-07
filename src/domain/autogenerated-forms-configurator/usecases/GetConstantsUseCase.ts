import { DataStoreConfigurationRepository } from "../repositories/DataStoreConfigurationRepository";

export class GetConstantsUseCase {
    constructor(private dataStoreConfigRepository: DataStoreConfigurationRepository) {}

    execute() {
        return this.dataStoreConfigRepository.getConstants();
    }
}
