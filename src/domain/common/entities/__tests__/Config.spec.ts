import { getPath } from "../OrgUnit";
import { getMainUserPaths } from "../Config";
import { config } from "./configFixtures";
import { orgUnits } from "./orgUnitFixtures";

describe("Config", () => {
    describe("getMainUserPaths", () => {
        it("should return the compacted result of getPath", () => {
            const result = getMainUserPaths(config);
            expect(result).toEqual([getPath(orgUnits)]);
        });

        it("should handle empty paths correctly", () => {
            const userWithoutOrgUnits = { ...config.currentUser, orgUnits: [] };
            const result = getMainUserPaths({ ...config, currentUser: userWithoutOrgUnits });
            expect(result).toEqual([]);
        });
    });
});
