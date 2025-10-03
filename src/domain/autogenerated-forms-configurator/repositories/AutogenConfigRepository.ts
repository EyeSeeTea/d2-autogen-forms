import { AutogenConfig } from "../../common/entities/AutogenConfig";
import { Code } from "../../common/entities/Base";

export interface AutogenConfigRepository {
    get(dataSetCode: Code): Promise<AutogenConfig>;
    save(dataSetCode: Code, config: AutogenConfig): Promise<void>;
}
