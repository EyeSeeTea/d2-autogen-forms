import { AutogenConfig } from "../../common/entities/AutogenConfig";

export interface DataStoreConfigurationRepository {
    get(namespace: string): Promise<AutogenConfig>;
    save(namespace: string, config: AutogenConfig): Promise<void>;
}
