import { getDataElementWithCode, DataElement, DataElementBoolean, DataElementText } from "../DataElement";
import { dataElementBase } from "./dataFixtures";

describe("DataElement", () => {
    const dataElementBoolean: DataElementBoolean = {
        ...dataElementBase,
        id: "1",
        code: "DE_BOOLEAN",
        name: "Boolean Data Element",
        type: "BOOLEAN",
        isTrueOnly: false,
    };

    const dataElementText: DataElementText = {
        ...dataElementBase,
        id: "2",
        code: "DE_TEXT",
        name: "Text Data Element",
        type: "TEXT",
    };

    const dataElements: DataElement[] = [dataElementBoolean, dataElementText];

    describe("getDataElementWithCode", () => {
        it("should return the correct DataElement when a matching code is found", () => {
            const codeToFind = "DE_BOOLEAN";
            const result = getDataElementWithCode(dataElements, codeToFind);
            expect(result).toEqual(dataElementBoolean);
        });

        it("should return undefined when no matching code is found", () => {
            const codeToFind = "NON_EXISTENT_CODE";
            const result = getDataElementWithCode(dataElements, codeToFind);
            expect(result).toBeUndefined();
        });
    });
});
