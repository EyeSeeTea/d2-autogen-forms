import fs from "fs";

import { Constant } from "../domain/common/entities/Constant";
import { ExportConstantRepository } from "../domain/common/repositories/ExportConstantRepository";

export class ExportConstantJsonRepository implements ExportConstantRepository {
    async export(path: string, constants: Constant[]): Promise<void> {
        fs.writeFileSync(path, JSON.stringify({ constants }, null, 4));
    }
}
