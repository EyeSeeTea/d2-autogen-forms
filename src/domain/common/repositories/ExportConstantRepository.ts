import { Constant } from "../entities/Constant";

export interface ExportConstantRepository {
    export(path: string, constants: Constant[]): Promise<void>;
}
