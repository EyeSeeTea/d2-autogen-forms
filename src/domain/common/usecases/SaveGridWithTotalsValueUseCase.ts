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
            const selector: Selector = {
                orgUnitId: dataValue.orgUnitId,
                period: dataValue.period,
                categoryOptionComboId: dataValue.categoryOptionComboId,
            };

            const valuesForColumn = this.getValuesForColumn({
                selector,
                store: storeUpdated,
                dataElements: columnDataElements,
                dataValue,
            });

            const colTotalDataValue = storeUpdated.get(columnTotal, {
                ...selector,
                categoryOptionComboId: columnTotal.cocId || dataValue.categoryOptionComboId,
            }) as DataValueNumberSingle;

            const updatedColTotalDataValue = {
                ...colTotalDataValue,
                value: valuesForColumn.length === 0 ? "" : _(valuesForColumn).sum().toString(),
            };

            await Promise.all([
                this.dataValueRepository.save(dataValue),
                this.dataValueRepository.save(updatedColTotalDataValue),
            ]);

            return [currentDataValue, updatedColTotalDataValue];
        }
    }

    private getValuesForColumn(options: {
        selector: Selector;
        store: DataValueStore;
        dataElements: DataElement[];
        dataValue: DataValueNumberSingle;
    }): number[] {
        const { dataValue, selector, store, dataElements } = options;
        const values = _(dataElements)
            .map(de => {
                const dv = store.get(de, {
                    ...selector,
                    categoryOptionComboId: dataValue.categoryOptionComboId,
                }) as DataValueNumberSingle;
                return dv.value;
            })
            .compact()
            .value();

        if (!values.length) return [];

        return values.map(v => Number(v));
    }
}

type Selector = {
    orgUnitId: string;
    period: string;
    categoryOptionComboId: string;
};
