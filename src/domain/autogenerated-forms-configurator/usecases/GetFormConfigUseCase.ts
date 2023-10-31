import { DataStoreConfigurationRepository } from "../repositories/DataStoreConfigurationRepository";

export class GetFormConfigUseCase {
    constructor(private dataStoreConfigRepository: DataStoreConfigurationRepository) {}

    execute(namespace: string) {
        return this.dataStoreConfigRepository.getFormConfig(namespace);
    }
}
