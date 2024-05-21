import { Indicator, checkIndicatorDirection, getIndicatorRelatedToDataElement, IndicatorDirection } from "../Indicator";
import { indicatorAfter, indicatorBefore, indicators } from "./indicatorFixtures";

describe("Indicator", () => {
    describe("checkIndicatorDirection", () => {
        it("should return true when the indicator's direction matches the provided direction", () => {
            const direction: IndicatorDirection = "after";

            // indicatorAfter indicator contain { direction: "after" }
            const result = checkIndicatorDirection(indicatorAfter, direction);
            expect(result).toBe(true);
        });

        it("should return false when the indicator's direction does not match the provided direction", () => {
            const direction: IndicatorDirection = "after";

            // indicatorBefore indicator contain { direction: "before" }
            const result = checkIndicatorDirection(indicatorBefore, direction);
            expect(result).toBe(false);
        });
    });

    describe("getIndicatorRelatedToDataElement", () => {
        it("should return the indicator related to the specified data element code", () => {
            const codeToFind = "DE_1";
            const result = getIndicatorRelatedToDataElement(indicators, codeToFind);
            // indicatorAfter indicator contain dataElement: { code: "DE_1", direction: "after" }
            expect(result).toEqual(indicatorAfter);
        });

        it("should return undefined when no indicator is related to the specified data element code", () => {
            const codeToFind = "NON_EXISTENT_CODE";
            const result = getIndicatorRelatedToDataElement(indicators, codeToFind);
            expect(result).toBeUndefined();
        });
    });
});
