import { Dhis2DataFormRepository } from "../../../../data/common/Dhis2DataFormRepository";
import { GetDataFormUseCase } from "../GetDataFormUseCase";
import { DataFormRepository } from "../../repositories/DataFormRepository";
import { Period } from "../../entities/DataValue";
import { mock, instance, when, verify, deepEqual } from "ts-mockito";
import { DataForm } from "../../entities/DataForm";
import { dataForm } from "./data/dataForm";
import { Id } from "../../entities/Base";
import { OrgUnitsRepository } from "../../repositories/OrgUnitsRepository";
import { OrgUnit } from "../../entities/OrgUnit";
import { Dhis2OrgUnitsRepository } from "../../../../data/common/Dhis2OrgUnitsRepository";

describe("GetDataFormUseCase", () => {
    let mockDataFormRepository: DataFormRepository;
    let mockOrgUnitRepository: OrgUnitsRepository;
    const dataSetId: Id = "dataSetId";
    const period: Period = "202101";
    const orgUnitId: Id = "orgUnitId";
    const dataFormRepositoryGetOptions = { id: dataSetId, period, orgUnitId };
    const options = { dataSetId, period, orgUnitId };

    beforeEach(() => {
        mockDataFormRepository = mock<DataFormRepository>(Dhis2DataFormRepository);
        mockOrgUnitRepository = mock<OrgUnitsRepository>(Dhis2OrgUnitsRepository);
    });

    it("calls the repository with correct parameters and returns the data form", async () => {
        const expectedDataForm: DataForm = {
            id: dataSetId,
            ...dataForm,
        };
        const expectedOrgUnit: OrgUnit = { id: orgUnitId, name: "Org Unit", code: "OU", path: "/OU", level: 1 };

        when(mockDataFormRepository.get(deepEqual(dataFormRepositoryGetOptions))).thenResolve(expectedDataForm);
        when(mockOrgUnitRepository.getById(orgUnitId)).thenResolve(expectedOrgUnit);

        const useCase = new GetDataFormUseCase(instance(mockDataFormRepository), instance(mockOrgUnitRepository));
        const result = await useCase.execute(options);

        expect(result).toEqual({ dataForm: expectedDataForm, orgUnit: expectedOrgUnit });
        verify(mockDataFormRepository.get(deepEqual(dataFormRepositoryGetOptions))).once();
    });

    it("handles errors thrown by the repository", async () => {
        const expectedError = new Error("Repository error");

        when(mockDataFormRepository.get(deepEqual(dataFormRepositoryGetOptions))).thenReject(expectedError);

        const useCase = new GetDataFormUseCase(instance(mockDataFormRepository), instance(mockOrgUnitRepository));

        await expect(useCase.execute(options)).rejects.toThrow(expectedError);
        verify(mockDataFormRepository.get(deepEqual(dataFormRepositoryGetOptions))).once();
    });
});
