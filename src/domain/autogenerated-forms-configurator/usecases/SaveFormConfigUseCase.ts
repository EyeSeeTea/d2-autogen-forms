import { DataStoreConfigurationRepository } from "../repositories/DataStoreConfigurationRepository";

export class SaveFormConfigUseCase {
    constructor(private dataStoreConfigRepository: DataStoreConfigurationRepository) {}

    execute(namespace: string, config: any) {
        return this.dataStoreConfigRepository.saveFormConfig(namespace, config);
    }
}
