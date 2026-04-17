import { Constant } from "../entities/Constant";
import { ConstantRepository } from "../repositories/ConstantRepository";

export class ListConstantsUseCase {
    constructor(private constantRepository: ConstantRepository) {}

    execute(prefix?: string): Promise<Constant[]> {
        return this.constantRepository.get(prefix);
    }
}
