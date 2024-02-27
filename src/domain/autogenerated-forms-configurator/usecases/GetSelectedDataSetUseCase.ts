import { Maybe } from "../../../utils/ts-utils";
import { Code } from "../entities/AutogenConfig";
import { DataSet } from "../entities/DataSet";
import { DataStoreConfigurationRepository } from "../repositories/DataStoreConfigurationRepository";

export class GetSelectedDataSetUseCase {
    constructor(private dataStoreConfigRepository: DataStoreConfigurationRepository) {}

    execute(dataSets: DataSet[], dataSetCode: Maybe<Code>) {
        return this.dataStoreConfigRepository.getSelectedDataSet(dataSets, dataSetCode);
    }
}
