import { OrgUnit } from "../OrgUnit";

export const rootOrgUnits: OrgUnit[] = [
    {
        id: "1",
        path: "/1",
        name: "OrgUnit1",
        level: 1,
        code: "",
    },
    {
        id: "4",
        path: "/4",
        name: "OrgUnit4",
        level: 1,
        code: "",
    },
];

export const childrenOrgUnits: OrgUnit[] = [
    {
        id: "2",
        path: "/1/2",
        name: "OrgUnit2",
        level: 2,
        code: "",
    },
    {
        id: "3",
        path: "/1/3",
        name: "OrgUnit3",
        level: 2,
        code: "",
    },
];

export const orgUnits: OrgUnit[] = [...rootOrgUnits, ...childrenOrgUnits];
