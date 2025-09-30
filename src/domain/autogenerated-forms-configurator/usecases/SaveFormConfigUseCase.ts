import { AutogenConfig } from "../../common/entities/AutogenConfig";
import { DataStoreConfigurationRepository } from "../repositories/DataStoreConfigurationRepository";

export class SaveFormConfigUseCase {
    constructor(private dataStoreConfigRepository: DataStoreConfigurationRepository) {}

    execute(namespace: string, config: AutogenConfig) {
        return this.dataStoreConfigRepository.save(namespace, config);
    }
}
