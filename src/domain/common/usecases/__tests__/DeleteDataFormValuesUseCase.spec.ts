import { DataValue, DataValueStore } from "../../entities/DataValue";
import { DataValueRepository } from "../../repositories/DataValueRepository";
import { instance, mock, when, verify, deepEqual } from "ts-mockito";
import { Dhis2DataValueRepository } from "../../../../data/common/Dhis2DataValueRepository";
import { dataValueText, dataValueFile } from "./data/dataValue";
import { DeleteDataFormValuesUseCase } from "../DeleteDataFormValuesUseCase";

const dataSetId = "dataSet1";

let mockDataValueRepository: DataValueRepository;
let mockDataValueStore: DataValueStore;

describe("DeleteDataFormValuesUseCase", () => {
    beforeEach(() => {
        mockDataValueRepository = mock<DataValueRepository>(Dhis2DataValueRepository);
        mockDataValueStore = mock<DataValueStore>(DataValueStore);
    });

    it("returns emptied dataValues", async () => {
        const useCase = givenDeleteDataFormValuesUseCase();
        const dataValues = [dataValueText, dataValueFile];
        const emptyDataValues = [
            { ...dataValueText, value: "" },
            { ...dataValueFile, file: undefined, fileToSave: undefined },
        ];

        givenDeletedDataValue(emptyDataValues);

        const result = await useCase.execute(dataValues, dataSetId);

        verify(mockDataValueRepository.delete(deepEqual(dataValues), dataSetId)).once();
        expect(result).toStrictEqual(emptyDataValues);
    });
});

function givenDeleteDataFormValuesUseCase() {
    const stubDataValueRepository = instance(mockDataValueRepository);
    return new DeleteDataFormValuesUseCase(stubDataValueRepository);
}

function givenDeletedDataValue(emptyDataValues: DataValue[]) {
    const stubDataValueStore = instance(mockDataValueStore);

    when(mockDataValueRepository.delete(emptyDataValues, dataSetId)).thenResolve();
    when(mockDataValueStore.merge(emptyDataValues)).thenReturn(stubDataValueStore);
}
