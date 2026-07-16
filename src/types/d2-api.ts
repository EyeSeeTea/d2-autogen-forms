import { D2Api } from "@eyeseetea/d2-api/2.34";
import { getMockApiFromClass } from "@eyeseetea/d2-api";
export { CancelableResponse } from "@eyeseetea/d2-api/repositories/CancelableResponse";
export { D2Api, DataStore } from "@eyeseetea/d2-api/2.34";

export type {
    D2Constant,
    D2DataSetSchema,
    D2Report,
    D2Section,
    D2SqlView,
    DataValueSetsDataValue,
    Id,
    MetadataPick,
    MetadataResponse,
    Pager,
    PartialModel,
    Ref,
    SelectedPick,
} from "@eyeseetea/d2-api/2.34";

export const getMockApi = getMockApiFromClass(D2Api);
