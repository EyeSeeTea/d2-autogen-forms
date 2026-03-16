import { AutogenConfigRepository } from "../repositories/AutogenConfigRepository";

export class GetFormConfigUseCase {
    constructor(private autogenConfigRepository: AutogenConfigRepository) {}

    execute(namespace: string) {
        return this.autogenConfigRepository.get(namespace);
    }
}
