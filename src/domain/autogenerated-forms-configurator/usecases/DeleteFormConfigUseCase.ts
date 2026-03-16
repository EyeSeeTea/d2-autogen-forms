import { AutogenConfigRepository } from "../repositories/AutogenConfigRepository";

export class DeleteFormConfigUseCase {
    constructor(private autogenConfigRepository: AutogenConfigRepository) {}

    execute(dataSetCode: string): Promise<void> {
        return this.autogenConfigRepository.delete(dataSetCode);
    }
}
