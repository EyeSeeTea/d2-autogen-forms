import { DataValue, DataValueStore, DataValueStoreD, getEmpty } from "../entities/DataValue";
import { DataValueRepository } from "../repositories/DataValueRepository";

export class DeleteDataFormValuesUseCase {
    constructor(private dataValueRepository: DataValueRepository) {}

    async execute(store: DataValueStore, dataValues: DataValue[]): Promise<DataValueStore> {
        if (dataValues.length === 0) {
            return store;
        }

        const storeUpdated = dataValues.reduce((acc, dataValue) => {
            const updatedDataValue = getEmpty(dataValue.dataElement, {
                ...dataValue,
                categoryOptionComboId: dataValue.dataElement.cocId || dataValue.categoryOptionComboId,
            });
            return {
                ...acc,
                [DataValueStore.getStoreKey({
                    dataElementId: updatedDataValue.dataElement.id,
                    period: updatedDataValue.period,
                    categoryOptionComboId: updatedDataValue.categoryOptionComboId,
                    orgUnit: updatedDataValue.orgUnitId,
                })]: updatedDataValue,
            };
        }, {} as DataValueStoreD);

        await this.dataValueRepository.delete(dataValues);

        return new DataValueStore(storeUpdated);
    }
}
