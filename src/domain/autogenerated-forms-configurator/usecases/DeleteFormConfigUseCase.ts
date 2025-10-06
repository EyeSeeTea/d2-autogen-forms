import { AutogenConfigRepository } from "../repositories/AutogenConfigRepository";

export class DeleteFormConfigUseCase {
    constructor(private autogenConfigRepository: AutogenConfigRepository) {}

    execute(dataSetCode: string) {
        return this.autogenConfigRepository.delete(dataSetCode);
    }
}
