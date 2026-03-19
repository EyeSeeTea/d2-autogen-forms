import { OrgUnit } from "../OrgUnit";

export const rootOrgUnits: OrgUnit[] = [
    { id: "1", code: "a", path: "/1", name: "OrgUnit1", level: 1 },
    { id: "4", code: "d", path: "/4", name: "OrgUnit4", level: 1 },
];

export const childrenOrgUnits: OrgUnit[] = [
    { id: "2", code: "b", path: "/1/2", name: "OrgUnit2", level: 2 },
    { id: "3", code: "c", path: "/1/3", name: "OrgUnit3", level: 2 },
];

export const orgUnits: OrgUnit[] = [...rootOrgUnits, ...childrenOrgUnits];
