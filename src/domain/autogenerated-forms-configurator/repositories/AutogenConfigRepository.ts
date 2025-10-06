import { AutogenConfig } from "../../common/entities/AutogenConfig";
import { Code } from "../../common/entities/Base";

export interface AutogenConfigRepository {
    get(dataSetCode: Code): Promise<AutogenConfig>;
    delete(dataSetCode: Code): Promise<void>;
    save(dataSetCode: Code, config: AutogenConfig): Promise<void>;
}
