import { Dhis2ConfigRepository } from "./data/common/Dhis2ConfigRepository";
import { Dhis2OrgUnitsRepository } from "./data/common/Dhis2OrgUnitsRepository";
import { GetConfig } from "./domain/common/usecases/GetConfig";
import { GetOrgUnitsUseCase } from "./domain/common/usecases/GetOrgUnitsUseCase";
import { D2Api } from "./types/d2-api";
import { getReportType } from "./webapp/utils/reportType";
import { Dhis2DataFormRepository } from "./data/common/Dhis2DataFormRepository";
import { SaveDataFormValueUseCase } from "./domain/common/usecases/SaveDataFormValue";
import { GetDataFormUseCase } from "./domain/common/usecases/GetDataFormUseCase";
import { GetDataFormValuesUseCase } from "./domain/common/usecases/GetDataFormValuesUseCase";
import { Dhis2DataValueRepository } from "./data/common/Dhis2DataValueRepository";
import { ApplyToAllUseCase } from "./domain/common/usecases/ApplyToAllUseCase";
import { SaveGridWithTotalsValueUseCase } from "./domain/common/usecases/SaveGridWithTotalsValue";

export function getCompositionRoot(api: D2Api) {
    const configRepository = new Dhis2ConfigRepository(api, getReportType());
    const orgUnitsRepository = new Dhis2OrgUnitsRepository(api);
    const dataFormRepository = new Dhis2DataFormRepository(api);
    const dataValueRepository = new Dhis2DataValueRepository(api);

    return {
        dataForms: getExecute({
            get: new GetDataFormUseCase(dataFormRepository),
            getValues: new GetDataFormValuesUseCase(dataValueRepository),
            saveValue: new SaveDataFormValueUseCase(dataValueRepository),
            applyToAll: new ApplyToAllUseCase(dataValueRepository),
            saveWithTotals: new SaveGridWithTotalsValueUseCase(dataValueRepository),
        }),
        orgUnits: getExecute({
            get: new GetOrgUnitsUseCase(orgUnitsRepository),
        }),
        config: getExecute({
            get: new GetConfig(configRepository),
        }),
    };
}

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

function getExecute<UseCases extends Record<Key, UseCase>, Key extends keyof UseCases>(
    useCases: UseCases
): { [K in Key]: UseCases[K]["execute"] } {
    const keys = Object.keys(useCases) as Key[];
    const initialOutput = {} as { [K in Key]: UseCases[K]["execute"] };

    return keys.reduce((output, key) => {
        const useCase = useCases[key];
        const execute = useCase.execute.bind(useCase) as UseCases[typeof key]["execute"];
        output[key] = execute;
        return output;
    }, initialOutput);
}

export interface UseCase {
    execute: Function;
}
