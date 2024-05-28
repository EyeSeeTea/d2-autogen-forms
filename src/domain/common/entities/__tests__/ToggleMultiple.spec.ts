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
    };

    const dataElement2: DataElement = {
        ...dataElementBase,
        id: "2",
        code: "DE_2",
        name: "Text Data Element 2",
        type: "TEXT",
    };

    const dataElements: Record<string, DataElement> = {
        dataElement1,
        dataElement2,
    };

    const toggleMultiple: ToggleMultiple[] = [
        { dataElement: "DE_1", condition: "condition1" },
        { dataElement: "DE_2", condition: "condition2" },
        { dataElement: "DE_3", condition: "condition3" }, // DE_3 does not exist in dataElements
    ];

    it("should return the correct DataElementToggle array", () => {
        const expected: DataElementToggle[] = [
            { dataElement: dataElement1, condition: "condition1" },
            { dataElement: dataElement2, condition: "condition2" },
        ];

        const result = buildToggleMultiple(toggleMultiple, dataElements);
        expect(result).toEqual(expected);
    });

    it("should log a warning for missing data elements", () => {
        buildToggleMultiple(toggleMultiple, dataElements);
        expect(console.warn).toHaveBeenCalledWith("Cannot found DE_3 in toggleMultiple config.");
    });

    it("should return an empty array if no matching data elements are found", () => {
        const toggleMultipleNone: ToggleMultiple[] = [
            { dataElement: "DE_4", condition: "condition4" },
            { dataElement: "DE_5", condition: "condition5" },
        ];
        const result = buildToggleMultiple(toggleMultipleNone, dataElements);
        expect(result).toEqual([]);
    });
});
