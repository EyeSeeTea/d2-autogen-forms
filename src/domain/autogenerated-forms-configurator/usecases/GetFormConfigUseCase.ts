import { AutogenConfigRepository } from "../repositories/AutogenConfigRepository";

export class GetFormConfigUseCase {
    constructor(private dataStoreConfigRepository: AutogenConfigRepository) {}

    execute(namespace: string) {
        return this.dataStoreConfigRepository.get(namespace);
    }
}
