import _ from "lodash";

import { D2Api, D2Constant, MetadataResponse, PartialModel } from "../types/d2-api";
import { Constant } from "../domain/common/entities/Constant";
import { getImportModeFromOptions, SaveOptions } from "../domain/common/entities/SaveOptions";
import { ErrorReportEntry, Stats } from "../domain/common/entities/Stats";
import { ConstantRepository } from "../domain/common/repositories/ConstantRepository";
import { promiseMap } from "../utils/promises";
import { getErrorFromResponse } from "./common/utils/d2-api";
import { writeFileSync } from "fs";

const POST_CHUNK_SIZE = 100;

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
        if (constants.length === 0) return Stats.empty();

        const constantsToSave = await this.buildConstantPayload(constants);
        if (constantsToSave.length === 0) return Stats.empty();

        const importMode = getImportModeFromOptions(options.post);
        const chunkStats = await promiseMap(_.chunk(constantsToSave, POST_CHUNK_SIZE), async chunk => {
            const d2PostResponse: Dhis2Response = await this.api.metadata
                .post({ constants: chunk }, { importMode })
                .getData();
            const response = d2PostResponse.response ?? d2PostResponse;
            return new Stats({
                created: response.stats.created,
                updated: response.stats.updated,
                ignored: response.stats.ignored,
                deleted: response.stats.deleted,
                errorMessage: getErrorFromResponse(response.typeReports),
                errorReports: extractErrorReports(response.typeReports),
            });
        });

        if (options.export) {
            writeFileSync("constants.json", JSON.stringify({ constants: constantsToSave }, null, 4));
        }
        return Stats.combine(chunkStats);
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
        const existingResult = await promiseMap(_.chunk(ids, POST_CHUNK_SIZE), async constantIds => {
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

function extractErrorReports(typeReports: MetadataResponse["typeReports"]): ErrorReportEntry[] {
    return typeReports.flatMap(typeReport =>
        (typeReport.objectReports ?? []).flatMap(objectReport =>
            (objectReport.errorReports ?? []).map(errorReport => ({
                message: errorReport.message,
                errorCode: errorReport.errorCode,
                errorProperty: errorReport.errorProperty,
            }))
        )
    );
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
