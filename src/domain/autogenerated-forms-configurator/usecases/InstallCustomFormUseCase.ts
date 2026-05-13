import { Id } from "../../common/entities/Base";
import { CustomFormRepository } from "../repositories/CustomFormRepository";

export class InstallCustomFormUseCase {
    constructor(private customFormRepository: CustomFormRepository) {}

    async execute(dataSetId: Id, htmlCode: string): Promise<void> {
        await this.customFormRepository.install(dataSetId, htmlCode);
    }
}
