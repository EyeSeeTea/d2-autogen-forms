import _ from "lodash";
import { DataElementIdCode, DataElementRepository } from "../domain/common/repositories/DataElementRepository";

import { D2Api } from "../types/d2-api";
import { promiseMap } from "../utils/promises";

export class DataElementD2Repository implements DataElementRepository {
    constructor(private api: D2Api) {}

    async getByCodes(codes: string[]): Promise<DataElementIdCode[]> {
        const result = await promiseMap(_.chunk(codes, 100), async dataElementCodes => {
            const response = await this.api.metadata
                .get({ dataElements: { fields: { id: true, code: true }, filter: { code: { in: dataElementCodes } } } })
                .getData();

            return response.dataElements.map(d2DataElement => {
                return d2DataElement;
            });
        });

        return _(result).flatten().value();
    }
}
