import _ from "lodash";
import fs from "fs";

import { DataElementIdCode } from "../domain/common/repositories/DataElementRepository";
import { ExportDataElementConfigRepository } from "../domain/common/repositories/ExportDataElementConfigRepository";

export class ExportDataElementConfigJsonRepository implements ExportDataElementConfigRepository {
    async export(path: string, dataElements: DataElementIdCode[]): Promise<void> {
        const autogenformConfig = this.buildAutogenFormConfig(dataElements);
        fs.writeFileSync(path, JSON.stringify({ dataElements: autogenformConfig }, null, 4));
    }

    private buildAutogenFormConfig(dataElements: DataElementIdCode[]) {
        const config = _(dataElements)
            .map(dataElement => {
                return { [dataElement.code]: { texts: { name: { code: dataElement.code } } } };
            })
            .compact()
            .value();
        return _.merge({}, ...config);
    }
}
