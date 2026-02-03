import { Id } from "../../domain/common/entities/Base";
import { OrgUnitPath, OrgUnit, getOrgUnitIdsFromPaths } from "../../domain/common/entities/OrgUnit";
import { OrgUnitsRepository } from "../../domain/common/repositories/OrgUnitsRepository";
import { D2Api } from "../../types/d2-api";

export class Dhis2OrgUnitsRepository implements OrgUnitsRepository {
    constructor(private api: D2Api) {}

    async getById(id: Id): Promise<OrgUnit> {
        const { organisationUnits } = await this.api.metadata
            .get({
                organisationUnits: {
                    filter: { id: { eq: id } },
                    fields: orgUnitFields,
                },
            })
            .getData();

        const organisationUnit = organisationUnits[0];
        if (!organisationUnit) {
            throw new Error(`OrgUnit with id ${id} not found`);
        }

        return organisationUnit;
    }

    async getFromPaths(paths: OrgUnitPath[]): Promise<OrgUnit[]> {
        const ids = getOrgUnitIdsFromPaths(paths);

        const { organisationUnits } = await this.api.metadata
            .get({
                organisationUnits: {
                    filter: { id: { in: ids } },
                    fields: orgUnitFields,
                },
            })
            .getData();

        return organisationUnits;
    }
}

const orgUnitFields = {
    id: true,
    name: true,
    path: true,
    level: true,
    code: true,
} as const;
