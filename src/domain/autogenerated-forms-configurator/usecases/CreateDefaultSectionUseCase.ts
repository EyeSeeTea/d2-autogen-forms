import { Id } from "../../common/entities/Base";
import { DataElementRef } from "../entities/DataSet";
import { DataSetRepository } from "../repositories/DataSetRepository";

export class CreateDefaultSectionUseCase {
    constructor(private dataSetRepository: DataSetRepository) {}

    execute(dataSetId: Id, dataElements: DataElementRef[]): Promise<void> {
        return this.dataSetRepository.createDefaultSection(dataSetId, dataElements);
    }
}
