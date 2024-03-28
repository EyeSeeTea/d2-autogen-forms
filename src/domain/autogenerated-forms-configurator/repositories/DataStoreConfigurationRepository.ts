import { AutogenConfig } from "../entities/AutogenConfig";

export interface DataStoreConfigurationRepository {
    getFormConfig(namespace: string): Promise<AutogenConfig>;
    saveFormConfig(namespace: string, config: AutogenConfig): Promise<void>;
}
