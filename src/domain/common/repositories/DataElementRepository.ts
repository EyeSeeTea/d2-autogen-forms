import { DataElement } from "../entities/DataElement";

export interface DataElementRepository {
    getByCodes(codes: string[]): Promise<DataElementIdCode[]>;
}

export type DataElementIdCode = Pick<DataElement, "id" | "code">;
