import { Id, NamedRef } from "./Base";
import { OrgUnit } from "./OrgUnit";

export interface User {
    id: Id;
    name: string;
    username: string;
    orgUnits: OrgUnit[];
    userRoles: NamedRef[];
    userGroups: NamedRef[];
    authorities: string[];
}

export const CONSTANT_ADD_AUTHORITY = "F_CONSTANT_ADD";

export function canCreateConstants(user: User): boolean {
    return user.authorities.includes("ALL") || user.authorities.includes(CONSTANT_ADD_AUTHORITY);
}
