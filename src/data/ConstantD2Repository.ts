import _ from "lodash";

import { D2Api, MetadataResponse } from "../types/d2-api";
import { Constant } from "../domain/common/entities/Constant";
import { getImportModeFromOptions, SaveOptions } from "../domain/common/entities/SaveOptions";
import { Stats } from "../domain/common/entities/Stats";
import { ConstantRepository } from "../domain/common/repositories/ConstantRepository";
import { promiseMap } from "../utils/promises";
import { getErrorFromResponse } from "./common/utils/d2-api";
import { writeFileSync } from "fs";

export class ConstantD2Repository implements ConstantRepository {
    constructor(private api: D2Api) {}

    async save(constants: Constant[], options: SaveOptions): Promise<Stats> {
        const ids = constants.map(constant => constant.id);
        const result = await promiseMap(_.chunk(ids, 100), async constantIds => {
            const d2Response = await this.api.metadata
                .get({ constants: { fields: { $owner: true }, filter: { id: { in: constantIds } } } })
                .getData();

            const constantsToSave = constantIds.map(constantId => {
                const existingConstant = d2Response.constants.find(d2Constant => d2Constant.id === constantId);
                const constant = constants.find(constant => constant.id === constantId);
                if (!constant) {
                    throw Error(`Cannot found constant: ${constantId}`);
                }
                return {
                    ...(existingConstant || {}),
                    id: constant.id,
                    code: constant.code,
                    description: constant.description,
                    name: constant.name,
                    shortName: constant.shortName,
                    translations: constant.translations,
                };
            });

            const d2PostResponse: Dhis2Response = await this.api.metadata
                .post({ constants: constantsToSave }, { importMode: getImportModeFromOptions(options.post) })
                .getData();
            const response = d2PostResponse.response ? d2PostResponse.response : d2PostResponse;
            const stats = new Stats({
                created: response.stats.created,
                updated: response.stats.updated,
                ignored: response.stats.ignored,
                deleted: response.stats.deleted,
                errorMessage: getErrorFromResponse(response.typeReports),
            });
            return { stats: stats, constants: constantsToSave };
        });
        const allStats = result.flatMap(result => result.stats);
        if (options.export) {
            writeFileSync(
                "constants.json",
                JSON.stringify({ constants: result.flatMap(result => result.constants) }, null, 4)
            );
        }
        return Stats.combine(allStats);
    }
}

type Dhis2Response = MetadataResponse & {
    response?: { stats: MetadataResponse["stats"]; typeReports: MetadataResponse["typeReports"] };
};
