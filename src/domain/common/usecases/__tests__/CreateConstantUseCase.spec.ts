import { anything, deepEqual, instance, mock, verify, when } from "ts-mockito";
import { CreateConstantUseCase } from "../CreateConstantUseCase";
import { Constant } from "../../entities/Constant";
import { ConstantRepository } from "../../repositories/ConstantRepository";
import { ConstantD2Repository } from "../../../../data/ConstantD2Repository";
import { ConstantSaveError } from "../../entities/ConstantSaveError";
import { Stats } from "../../entities/Stats";

let mockConstantRepository: ConstantRepository;

const newConstant: Constant = {
    id: "",
    name: "Footnote National Policies",
    shortName: "FOOTNOTE_NATIONAL_POLICIES",
    code: "MAL_FOOTNOTE_NATIONAL_POLICIES",
    description: "Policy notes",
    value: 0,
    translations: [],
};

const okStats = new Stats({ created: 1, updated: 0, ignored: 0, deleted: 0, errorMessage: "" });

describe("CreateConstantUseCase", () => {
    beforeEach(() => {
        mockConstantRepository = mock<ConstantRepository>(ConstantD2Repository);
    });

    it("delegates to ConstantRepository.save with post=true and resolves on success", async () => {
        when(mockConstantRepository.save(anything(), anything())).thenResolve(okStats);
        const useCase = new CreateConstantUseCase(instance(mockConstantRepository));

        await useCase.execute(newConstant);

        verify(mockConstantRepository.save(deepEqual([newConstant]), deepEqual({ post: true, export: false }))).once();
    });

    it("throws ConstantSaveError exposing structured field errors when the import fails", async () => {
        const failStats = new Stats({
            created: 0,
            updated: 0,
            ignored: 1,
            deleted: 0,
            errorMessage: "Property `code` requires unique value",
            errorReports: [
                {
                    message: "Property `code` requires unique value",
                    errorCode: "E5003",
                    errorProperty: "code",
                },
            ],
        });
        when(mockConstantRepository.save(anything(), anything())).thenResolve(failStats);
        const useCase = new CreateConstantUseCase(instance(mockConstantRepository));

        await expect(useCase.execute(newConstant)).rejects.toBeInstanceOf(ConstantSaveError);
        await expect(useCase.execute(newConstant)).rejects.toMatchObject({
            reports: [{ errorCode: "E5003", errorProperty: "code" }],
        });
    });

    it("falls back to a single-entry ConstantSaveError when only errorMessage is set", async () => {
        const failStats = new Stats({
            created: 0,
            updated: 0,
            ignored: 1,
            deleted: 0,
            errorMessage: "Constant code already exists",
        });
        when(mockConstantRepository.save(anything(), anything())).thenResolve(failStats);
        const useCase = new CreateConstantUseCase(instance(mockConstantRepository));

        await expect(useCase.execute(newConstant)).rejects.toThrow("Constant code already exists");
    });
});
