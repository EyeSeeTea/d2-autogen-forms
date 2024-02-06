import { DataElementIdCode } from "./DataElementRepository";

export interface ExportDataElementConfigRepository {
    export(path: string, dataElements: DataElementIdCode[]): Promise<void>;
}
