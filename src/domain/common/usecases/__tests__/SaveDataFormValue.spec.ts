import { SaveDataFormValueUseCase } from "../SaveDataFormValue";
import { DataValue, DataValueStore } from "../../entities/DataValue";
import { DataValueRepository } from "../../repositories/DataValueRepository";
import { instance, mock, when, verify, anything, deepEqual } from "ts-mockito";
import { Dhis2DataValueRepository } from "../../../../data/common/Dhis2DataValueRepository";
import { dataValueText, dataValueFile } from "./data/dataValue";

let mockDataValueRepository: DataValueRepository;
let mockDataValueStore: DataValueStore;

describe("SaveDataFormValueUseCase", () => {
    beforeEach(() => {
        mockDataValueRepository = mock<DataValueRepository>(Dhis2DataValueRepository);
        mockDataValueStore = mock<DataValueStore>(DataValueStore);
    });

    it("returns the store if the existing data value is equal to the new data value and type is not FILE", async () => {
        const useCase = givenSaveDataFormValueUseCase();
        const dataValue = dataValueText;
        givenExistingDataValue(dataValue);

        const stubDataValueStore = instance(mockDataValueStore);

        const result = await useCase.execute(stubDataValueStore, dataValue);

        verify(mockDataValueStore.get(dataValue.dataElement, dataValue)).once();
        verify(mockDataValueStore.set(anything())).never();
        verify(mockDataValueRepository.save(anything())).never();
        expect(result).toBe(stubDataValueStore);
    });

    it("updates the store with the new data value and saves it", async () => {
        const useCase = givenSaveDataFormValueUseCase();
        const dataValue = dataValueText;
        const saveDataValue = { ...dataValueText, value: "20" };
        givenExistingDataValue(dataValue);
        givenSavedDataValue(saveDataValue);

        const dataValueStore = DataValueStore.from([dataValue]);
        const saveDataValueStore = DataValueStore.from([saveDataValue]);

        const result = await useCase.execute(dataValueStore, saveDataValue);

        verify(mockDataValueRepository.save(deepEqual(saveDataValue))).once();
        expect(result).toStrictEqual(saveDataValueStore);
    });

    it("updates the store with the new FILE data value and saves it", async () => {
        const useCase = givenSaveDataFormValueUseCase();
        const dataValue = dataValueFile;
        const saveDataValue = {
            ...dataValueFile,
            file: {
                id: "1",
                name: "Test file",
                size: 1024,
                url: "/updated/path/to/file",
            },
        };
        givenExistingDataValue(dataValue);
        givenSavedDataValue(saveDataValue);

        const dataValueStore = DataValueStore.from([dataValue]);
        const saveDataValueStore = DataValueStore.from([saveDataValue]);

        const result = await useCase.execute(dataValueStore, saveDataValue);

        verify(mockDataValueRepository.save(deepEqual(saveDataValue))).once();
        expect(result).toStrictEqual(saveDataValueStore);
    });
});

function givenSaveDataFormValueUseCase() {
    const stubDataValueRepository = instance(mockDataValueRepository);
    return new SaveDataFormValueUseCase(stubDataValueRepository);
}

function givenExistingDataValue(dataValue: DataValue) {
    when(mockDataValueStore.get(dataValue.dataElement, dataValue)).thenReturn(dataValue);
}

function givenSavedDataValue(savedDataValue: DataValue) {
    const stubDataValueStore = instance(mockDataValueStore);

    when(mockDataValueRepository.save(savedDataValue)).thenResolve(savedDataValue);
    when(mockDataValueStore.set(savedDataValue)).thenReturn(stubDataValueStore);
}
