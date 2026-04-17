import _ from "lodash";

import { D2Api, D2Constant, MetadataResponse, PartialModel } from "../types/d2-api";
import { Constant } from "../domain/common/entities/Constant";
import { getImportModeFromOptions, SaveOptions } from "../domain/common/entities/SaveOptions";
import { Stats } from "../domain/common/entities/Stats";
import { ConstantRepository } from "../domain/common/repositories/ConstantRepository";
import { promiseMap } from "../utils/promises";
import { getErrorFromResponse } from "./common/utils/d2-api";
import { writeFileSync } from "fs";

export class ConstantD2Repository implements ConstantRepository {
    constructor(private api: D2Api) {}

    async get(prefix?: string): Promise<Constant[]> {
        const filter = prefix ? { code: { $like: `${prefix}%` } } : undefined;
        const { objects: constants } = await this.api.models.constants
            .get({ fields: constantFields, paging: false, filter })
            .getData();

        return constants;
    }

    async save(constants: Constant[], options: SaveOptions): Promise<Stats> {
        const constantsToSave = await this.buildConstantPayload(constants);

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

        if (options.export) {
            writeFileSync("constants.json", JSON.stringify({ constants: constantsToSave }, null, 4));
        }
        return stats;
    }

    private async buildConstantPayload(constants: readonly Constant[]): Promise<PartialModel<D2Constant>[]> {
        const existingConstants = constants.filter(constant => constant.id !== "");
        const newConstants = constants.filter(constant => constant.id === "");

        const newPayloads: PartialModel<D2Constant>[] = newConstants.map(constant => ({
            code: constant.code,
            description: constant.description,
            name: constant.name,
            shortName: constant.shortName,
            value: constant.value,
            translations: constant.translations,
        }));

        if (existingConstants.length === 0) return newPayloads;

        const ids = existingConstants.map(constant => constant.id);
        const existingResult = await promiseMap(_.chunk(ids, 100), async constantIds => {
            const d2Response = await this.api.metadata
                .get({ constants: { fields: { $owner: true }, filter: { id: { in: constantIds } } } })
                .getData();

            return constantIds.map(constantId => {
                const existingConstant = d2Response.constants.find(d2Constant => d2Constant.id === constantId);
                const constant = existingConstants.find(constant => constant.id === constantId);
                if (!constant) {
                    throw Error(`Cannot find constant: ${constantId}`);
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
        });

        return [...existingResult.flat(), ...newPayloads];
    }
}

type Dhis2Response = MetadataResponse & {
    response?: { stats: MetadataResponse["stats"]; typeReports: MetadataResponse["typeReports"] };
};

const constantFields = {
    id: true,
    name: true,
    code: true,
    description: true,
    shortName: true,
    translations: true,
    value: true,
};
