import { AutogenConfig } from "../../common/entities/AutogenConfig";
import { Code } from "../../common/entities/Base";
import { getSectionPeriodsIssues, isSectionPeriodsError } from "../../common/entities/SectionPeriodsConfig";
import { AutogenConfigRepository } from "../repositories/AutogenConfigRepository";

export class SaveFormConfigUseCase {
    constructor(private autogenConfigRepository: AutogenConfigRepository) {}

    execute(dataSetCode: Code, config: AutogenConfig): Promise<void> {
        const errors = getSectionPeriodsIssues(config).filter(isSectionPeriodsError);
        if (errors.length > 0) {
            return Promise.reject(new Error(errors.map(error => error.message).join(" ")));
        }

        return this.autogenConfigRepository.save(dataSetCode, config);
    }
}
