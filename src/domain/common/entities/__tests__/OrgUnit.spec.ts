import {
    OrgUnitPath,
    getRoots,
    getRootIds,
    getPath,
    getOrgUnitIdsFromPaths,
    getOrgUnitParentPath,
    getOrgUnitsFromId,
} from "../OrgUnit";
import { childrenOrgUnits, orgUnits, rootOrgUnits } from "./orgUnitFixtures";

describe("OrgUnit", () => {
    describe("getRoots", () => {
        it("should return the root org units", () => {
            const result = getRoots(orgUnits);
            expect(result).toEqual(rootOrgUnits);
        });
    });

    describe("getRootIds", () => {
        it("should return the ids of root org units", () => {
            const expectedRootIds = ["1", "4"];
            const result = getRootIds(orgUnits);
            expect(result).toEqual(expectedRootIds);
        });
    });

    describe("getPath", () => {
        it("should return the path of the first root org unit", () => {
            const expectedPath = "/1";
            const result = getPath(orgUnits);
            expect(result).toEqual(expectedPath);
        });
    });

    describe("getOrgUnitIdsFromPaths", () => {
        it("should return the ids extracted from org unit paths", () => {
            const orgUnitPathsSelected: OrgUnitPath[] = ["/1/2", "/1/3"];
            const expectedOrgUnitIds = ["2", "3"];
            const result = getOrgUnitIdsFromPaths(orgUnitPathsSelected);
            expect(result).toEqual(expectedOrgUnitIds);
        });
    });

    describe("getOrgUnitParentPath", () => {
        it("should return the parent path of the given org unit path", () => {
            const path = "/1/2";
            const expectedParentPath = "/1";
            const result = getOrgUnitParentPath(path);
            expect(result).toEqual(expectedParentPath);
        });
    });

    describe("getOrgUnitsFromId", () => {
        it("should return org units with the given ids", () => {
            const orgUnitIds = ["2", "3"];
            const result = getOrgUnitsFromId(orgUnitIds, orgUnits);
            expect(result).toEqual(childrenOrgUnits);
        });
    });
});
