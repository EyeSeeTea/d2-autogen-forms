import { Constant } from "../entities/Constant";
import { constantSaveError } from "../entities/ConstantSaveError";
import { ConstantRepository } from "../repositories/ConstantRepository";

export class CreateConstantUseCase {
    constructor(private constantRepository: ConstantRepository) {}

    async execute(input: Constant): Promise<void> {
        const stats = await this.constantRepository.save([input], { post: true, export: false });
        if (stats.errorReports.length > 0) {
            throw constantSaveError(stats.errorReports);
        }
        if (stats.errorMessage) {
            throw constantSaveError([{ message: stats.errorMessage, errorCode: "", errorProperty: "" }]);
        }
    }
}
