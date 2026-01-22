import { DataValue, getEmpty } from "../entities/DataValue";
import { DataValueRepository } from "../repositories/DataValueRepository";

export class DeleteDataFormValuesUseCase {
    constructor(private dataValueRepository: DataValueRepository) {}

    async execute(dataValues: DataValue[]): Promise<DataValue[]> {
        if (dataValues.length === 0) {
            return [];
        }

        const updatedDataValues = dataValues.map(dataValue => {
            return getEmpty(dataValue.dataElement, {
                ...dataValue,
                categoryOptionComboId: dataValue.dataElement.cocId || dataValue.categoryOptionComboId,
            });
        });

        await this.dataValueRepository.delete(dataValues);

        return updatedDataValues;
    }
}
