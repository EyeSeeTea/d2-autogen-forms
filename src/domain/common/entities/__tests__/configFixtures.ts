import { Config } from "../Config";
import { orgUnits } from "./orgUnitFixtures";

export const config: Config = {
    dataSets: undefined,
    sections: undefined,
    currentUser: {
        id: "1",
        name: "Test User",
        username: "User",
        orgUnits: orgUnits,
        userRoles: [],
        userGroups: [],
    },
    sqlViews: undefined,
    pairedDataElementsByDataSet: undefined,
    orgUnits: undefined,
    sectionsByDataSet: undefined,
    years: undefined,
    approvalWorkflow: undefined,
    categoryOptionCombos: {
        default: { id: "defaultCoc" },
    },
    translations: {
        yes: "Yes",
        no: "No",
    },
};
