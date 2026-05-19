import { Id } from "../../common/entities/Base";
import { CustomFormRepository } from "../repositories/CustomFormRepository";
import { DataSetRepository } from "../repositories/DataSetRepository";

export class InstallCustomFormUseCase {
    constructor(
        private customFormRepository: CustomFormRepository,
        private dataSetRepository: DataSetRepository
    ) {}

    async execute(dataSetId: Id, htmlCode: string): Promise<void> {
        const dataSet = await this.dataSetRepository.getById(dataSetId);
        if (!dataSet.canBeModified) throw new Error("Forbidden: you do not have write access to this dataset");

        const existing = await this.customFormRepository.get(dataSetId);
        await this.customFormRepository.install(dataSetId, htmlCode, existing.id);
    }
}
