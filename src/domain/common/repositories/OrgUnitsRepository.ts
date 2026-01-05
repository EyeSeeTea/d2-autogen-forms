import { Id } from "../entities/Base";
import { OrgUnit, OrgUnitPath } from "../entities/OrgUnit";

export interface OrgUnitsRepository {
    getById(id: Id): Promise<OrgUnit>;
    getFromPaths(paths: OrgUnitPath[]): Promise<OrgUnit[]>;
}
