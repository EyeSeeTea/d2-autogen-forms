import { Id } from "@eyeseetea/d2-api";
import { Period } from "../entities/DataValue";
import { DataFormRepository } from "../repositories/DataFormRepository";
import { OrgUnitsRepository } from "../repositories/OrgUnitsRepository";
import { DataFormWithOU } from "../entities/DataForm";

export class GetDataFormUseCase {
    constructor(private dataFormRepository: DataFormRepository, private orgUnitsRepository: OrgUnitsRepository) {}

    async execute(options: { dataSetId: Id; period: Period; orgUnitId: Id }): Promise<DataFormWithOU> {
        const orgUnit = await this.orgUnitsRepository.getById(options.orgUnitId);
        const dataForm = await this.dataFormRepository.get({
            id: options.dataSetId,
            period: options.period,
            orgUnitId: options.orgUnitId,
        });

        return {
            ...dataForm,
            orgUnit,
        };
    }
}
