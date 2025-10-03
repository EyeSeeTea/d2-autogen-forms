import { AutogenConfig } from "../../common/entities/AutogenConfig";
import { AutogenConfigRepository } from "../repositories/AutogenConfigRepository";

export class SaveFormConfigUseCase {
    constructor(private dataStoreConfigRepository: AutogenConfigRepository) {}

    execute(namespace: string, config: AutogenConfig) {
        return this.dataStoreConfigRepository.save(namespace, config);
    }
}
