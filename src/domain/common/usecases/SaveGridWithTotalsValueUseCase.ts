import _ from "lodash";
import { DataValue, DataValueNumberSingle, DataValueStore } from "../entities/DataValue";
import { DataValueRepository } from "../repositories/DataValueRepository";
import { DataElement } from "../entities/DataElement";

export class SaveGridWithTotalsValueUseCase {
    constructor(private dataValueRepository: DataValueRepository) {}

    async execute(
        store: DataValueStore,
        dataValue: DataValueNumberSingle,
        columnTotal: DataElement,
        columnDataElements: DataElement[],
        _cocId: string
    ): Promise<DataValue[]> {
        const existingDataValue = store.get(dataValue.dataElement, dataValue);

        if (_.isEqual(existingDataValue, dataValue)) {
            return [];
        } else {
            // SAVE FIELD
            const currentDataValue = {
                ...dataValue,
                categoryOptionComboId: dataValue.dataElement.cocId || dataValue.categoryOptionComboId,
            };

            const storeUpdated = store.set(currentDataValue);

            // SAVE COLUMN TOTAL
            const selector = {
                orgUnitId: dataValue.orgUnitId,
                period: dataValue.period,
                categoryOptionComboId: dataValue.categoryOptionComboId,
            };

            const newColTotalValue = columnDataElements
                .map(de => {
                    const dv = storeUpdated.get(de, {
                        ...selector,
                        categoryOptionComboId: dataValue.categoryOptionComboId,
                    }) as DataValueNumberSingle;
                    return dv.value ?? "0";
                })
                .reduce((partialSum, i) => partialSum + Number(i), 0);

            const colTotalDataValue = storeUpdated.get(columnTotal, {
                ...selector,
                categoryOptionComboId: columnTotal.cocId || dataValue.categoryOptionComboId,
            }) as DataValueNumberSingle;

            const updatedColTotalDataValue = {
                ...colTotalDataValue,
                value: newColTotalValue.toString(),
            };

            await Promise.all([
                this.dataValueRepository.save(dataValue),
                this.dataValueRepository.save(updatedColTotalDataValue),
            ]);

            return [currentDataValue, updatedColTotalDataValue];
        }
    }
}
