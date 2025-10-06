import { AutogenConfig } from "../../common/entities/AutogenConfig";
import { Code } from "../../common/entities/Base";
import { AutogenConfigRepository } from "../repositories/AutogenConfigRepository";

export class SaveFormConfigUseCase {
    constructor(private autogenConfigRepository: AutogenConfigRepository) {}

    execute(dataSetCode: Code, config: AutogenConfig) {
        return this.autogenConfigRepository.save(dataSetCode, config);
    }
}
