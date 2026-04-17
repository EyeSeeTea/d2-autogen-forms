import { Constant } from "../entities/Constant";
import { ConstantRepository } from "../repositories/ConstantRepository";

export class CreateConstantUseCase {
    constructor(private constantRepository: ConstantRepository) {}

    async execute(input: Constant): Promise<void> {
        const stats = await this.constantRepository.save([input], { post: true, export: false });
        if (stats.errorMessage) {
            throw new Error(stats.errorMessage);
        }
    }
}
