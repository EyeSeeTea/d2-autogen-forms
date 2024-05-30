import { Dhis2DataFormRepository } from "../../../../data/common/Dhis2DataFormRepository";
import { GetDataFormUseCase } from "../GetDataFormUseCase";
import { DataFormRepository } from "../../repositories/DataFormRepository";
import { Period } from "../../entities/DataValue";
import { mock, instance, when, verify, deepEqual } from "ts-mockito";
import { DataForm } from "../../entities/DataForm";
import { dataForm } from "./data/dataForm";
import { Id } from "../../entities/Base";

describe("GetDataFormUseCase", () => {
    let mockDataFormRepository: DataFormRepository;
    const dataSetId: Id = "dataSetId";
    const period: Period = "202101";
    const orgUnitId: Id = "orgUnitId";
    const dataFormRepositoryGetOptions = { id: dataSetId, period, orgUnitId };
    const options = { dataSetId, period, orgUnitId };

    beforeEach(() => {
        mockDataFormRepository = mock<DataFormRepository>(Dhis2DataFormRepository);
    });

    it("calls the repository with correct parameters and returns the data form", async () => {
        const expectedDataForm: DataForm = {
            id: dataSetId,
            ...dataForm,
        };

        when(mockDataFormRepository.get(deepEqual(dataFormRepositoryGetOptions))).thenResolve(expectedDataForm);

        const useCase = new GetDataFormUseCase(instance(mockDataFormRepository));
        const result = await useCase.execute(options);

        expect(result).toEqual(expectedDataForm);
        verify(mockDataFormRepository.get(deepEqual(dataFormRepositoryGetOptions))).once();
    });

    it("handles errors thrown by the repository", async () => {
        const expectedError = new Error("Repository error");

        when(mockDataFormRepository.get(deepEqual(dataFormRepositoryGetOptions))).thenReject(expectedError);

        const useCase = new GetDataFormUseCase(instance(mockDataFormRepository));

        await expect(useCase.execute(options)).rejects.toThrow(expectedError);
        verify(mockDataFormRepository.get(deepEqual(dataFormRepositoryGetOptions))).once();
    });
});
