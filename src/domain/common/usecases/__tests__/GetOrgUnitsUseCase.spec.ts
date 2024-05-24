import { Dhis2OrgUnitsRepository } from "../../../../data/common/Dhis2OrgUnitsRepository";
import { OrgUnit, OrgUnitPath } from "../../entities/OrgUnit";
import { OrgUnitsRepository } from "../../repositories/OrgUnitsRepository";
import { GetOrgUnitsUseCase } from "../../usecases/GetOrgUnitsUseCase";
import { mock, instance, when, verify, deepEqual } from "ts-mockito";

describe("GetOrgUnitsUseCase", () => {
    let mockOrgUnitsRepository: OrgUnitsRepository;

    beforeEach(() => {
        mockOrgUnitsRepository = mock<OrgUnitsRepository>(Dhis2OrgUnitsRepository);
    });

    it("calls the repository with correct parameters and returns the org units", async () => {
        const paths: OrgUnitPath[] = ["/root/unit1", "/root"];
        const expectedOrgUnits: OrgUnit[] = [
            { id: "1", name: "Unit 1", path: "/root/unit1", level: 1 },
            { id: "2", name: "Unit 2", path: "/root", level: 2 },
        ];

        when(mockOrgUnitsRepository.getFromPaths(deepEqual(paths))).thenResolve(expectedOrgUnits);

        const useCase = new GetOrgUnitsUseCase(instance(mockOrgUnitsRepository));
        const result = await useCase.execute({ paths });

        expect(result).toEqual(expectedOrgUnits);
        verify(mockOrgUnitsRepository.getFromPaths(deepEqual(paths))).once();
    });

    it("handles errors thrown by the repository", async () => {
        const paths: OrgUnitPath[] = ["/root/unit1", "/root/unit2"];
        const expectedError = new Error("Repository error");

        when(mockOrgUnitsRepository.getFromPaths(deepEqual(paths))).thenReject(expectedError);

        const useCase = new GetOrgUnitsUseCase(instance(mockOrgUnitsRepository));

        await expect(useCase.execute({ paths })).rejects.toThrow(expectedError);
        verify(mockOrgUnitsRepository.getFromPaths(deepEqual(paths))).once();
    });
});
