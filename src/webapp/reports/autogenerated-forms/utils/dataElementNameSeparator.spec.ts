import {
    PERIOD_NAME_SEPARATOR,
    hasIndexedSubRowPrefix,
    joinDataElementName,
    splitDataElementName,
} from "./dataElementNameSeparator";

describe("dataElementNameSeparator", () => {
    it("splits names with regular spaces around hyphen", () => {
        expect(splitDataElementName("MAL - Compound name")).toEqual(["MAL", "Compound name"]);
    });

    it("splits names with a non-breaking space before the hyphen", () => {
        expect(splitDataElementName("MAL\u00A0- Compound name")).toEqual(["MAL", "Compound name"]);
    });

    it("joins names with the normalized separator", () => {
        expect(joinDataElementName(["MAL", "Compound name"])).toBe("MAL - Compound name");
    });

    it("supports period separators and indexed row prefixes", () => {
        expect("Group\u00A0- Subgroup".split(PERIOD_NAME_SEPARATOR)).toEqual(["Group", "Subgroup"]);
        expect(hasIndexedSubRowPrefix("1.2\u00A0- Subgroup")).toBe(true);
        expect(hasIndexedSubRowPrefix("1.2 - Subgroup")).toBe(true);
    });
});
