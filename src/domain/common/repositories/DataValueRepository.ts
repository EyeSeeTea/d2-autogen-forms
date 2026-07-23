import { Id } from "../entities/Base";
import { DataValue, DataValueTextMultiple, Period } from "../entities/DataValue";

export interface DataValueRepository {
    get(options: { dataSetId: Id; orgUnits: Id[]; periods: Period[] }): Promise<DataValue[]>;
    save(dataValue: DataValue, dataSetId: Id): Promise<DataValue>;
    delete(dataValues: DataValue[]): Promise<void>;
    applyToAll(
        dataValue: DataValueTextMultiple,
        sourceTypeDeList: DataElementRefType[]
    ): Promise<"SUCCESS" | "ERROR" | "WARNING" | "OK">;
}

export type DataElementRefType = { id: string; name: string };
