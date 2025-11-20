import { DataSet } from "../entities/DataSet";
import { DataSetRepository } from "../repositories/DataSetRepository";

export type AutogenConfigDataSets = {
    dataSetsWithExistingConfig: DataSet[];
    dataSetsWithoutConfig: DataSet[];
};

export class GetDataSetsUseCase {
    constructor(private dataSetRepository: DataSetRepository) {}

    async execute(): Promise<AutogenConfigDataSets> {
        const dataSets = await this.dataSetRepository.get();
        const dataSetsWithExistingConfig = dataSets.filter(ds => ds.configExists);
        const dataSetsWithoutConfig = dataSets.filter(ds => !ds.configExists);

        return { dataSetsWithExistingConfig: dataSetsWithExistingConfig, dataSetsWithoutConfig: dataSetsWithoutConfig };
    }
}
