import { buildToggleMultiple, DataElementToggle, ToggleMultiple } from "../ToggleMultiple";
import { DataElement } from "../DataElement";
import { dataElementText as dataElementBase } from "./dataFixtures";

// Mock console.warn to catch warnings in test output
global.console = { ...global.console, warn: jest.fn() };

describe("buildToggleMultiple", () => {
    const dataElement1: DataElement = {
        ...dataElementBase,
        id: "1",
        code: "DE_1",
        name: "Text Data Element 1",
        type: "TEXT",
        disabled: false,
    };

    const dataElement2: DataElement = {
        ...dataElementBase,
        id: "2",
        code: "DE_2",
        name: "Text Data Element 2",
        type: "TEXT",
        disabled: false,
    };

    const dataElements: Record<string, DataElement> = {
        dataElement1,
        dataElement2,
    };

    const toggleMultiple: ToggleMultiple = {
        logicalOperator: "AND",
        conditions: [
            { type: "dataElement", dataElement: "DE_1", condition: "condition1" },
            { type: "dataElement", dataElement: "DE_2", condition: "condition2" },
            { type: "dataElement", dataElement: "DE_3", condition: "condition3" }, // DE_3 does not exist in dataElements
        ],
    };

    it("should return the correct DataElementToggle array", () => {
        const expected: DataElementToggle = {
            logicalOperator: "AND",
            toggleDataElements: [
                { type: "dataElement", dataElement: dataElement1, condition: "condition1" },
                { type: "dataElement", dataElement: dataElement2, condition: "condition2" },
            ],
            orgUnitConditions: [],
        };

        const result = buildToggleMultiple(
            toggleMultiple,
            { dataElements: [{ code: dataElement1.code }, { code: dataElement2.code }] },
            dataElements
        );
        expect(result).toEqual(expected);
    });

    it("should log a warning for missing data elements", () => {
        buildToggleMultiple(
            toggleMultiple,
            { dataElements: [{ code: dataElement1.code }, { code: dataElement2.code }] },
            dataElements
        );
        expect(console.warn).toHaveBeenCalledWith("Cannot found DE_3 in toggleMultiple config.");
    });

    it("should return an empty array if no matching data elements are found", () => {
        const toggleMultipleNone: ToggleMultiple = {
            logicalOperator: "AND",
            conditions: [
                { type: "dataElement", dataElement: "DE_4", condition: "condition4" },
                { type: "dataElement", dataElement: "DE_5", condition: "condition5" },
            ],
        };
        const result = buildToggleMultiple(
            toggleMultipleNone,
            { dataElements: [{ code: dataElement1.code }, { code: dataElement2.code }] },
            dataElements
        );
        expect(result).toEqual({ logicalOperator: "AND", toggleDataElements: [], orgUnitConditions: [] });
    });

    it("should keep orgUnit conditions when the section has no data elements", () => {
        const toggleMultipleOrgUnitOnly: ToggleMultiple = {
            logicalOperator: "AND",
            conditions: [{ type: "orgUnit", orgUnits: ["AND"], condition: "hide", disabled: true }],
        };
        const result = buildToggleMultiple(toggleMultipleOrgUnitOnly, { dataElements: [] }, dataElements);

        expect(result).toEqual({
            logicalOperator: "AND",
            toggleDataElements: [],
            orgUnitConditions: [{ orgUnitCodes: ["AND"], condition: "hide", disabled: true }],
        });
    });

    it("should not add orgUnitConditions when the section has data elements", () => {
        const toggleMultipleWithOrgUnit: ToggleMultiple = {
            logicalOperator: "AND",
            conditions: [{ type: "orgUnit", orgUnits: ["AND"], condition: "hide", disabled: true }],
        };
        const result = buildToggleMultiple(
            toggleMultipleWithOrgUnit,
            { dataElements: [{ code: dataElement1.code }] },
            dataElements
        );

        expect(result).toEqual({
            logicalOperator: "AND",
            toggleDataElements: [
                {
                    type: "orgUnit",
                    orgUnitCodes: ["AND"],
                    condition: "hide",
                    dataElement: { ...dataElement1, disabled: true },
                },
            ],
            orgUnitConditions: [],
        });
    });
});
