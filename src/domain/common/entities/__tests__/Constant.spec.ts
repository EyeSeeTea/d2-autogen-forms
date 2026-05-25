import { deriveCode, deriveShortName, shortNameMaxLength } from "../Constant";

describe("Constant", () => {
    describe("deriveShortName", () => {
        it("converts a plain name to upper snake case", () => {
            expect(deriveShortName("Footnote National Policies")).toBe("FOOTNOTE_NATIONAL_POLICIES");
        });

        it("replaces special characters with underscores", () => {
            expect(deriveShortName("my-header (v2)")).toBe("MY_HEADER_V2");
        });

        it("collapses consecutive separators", () => {
            expect(deriveShortName("a   b__c--d")).toBe("A_B_C_D");
        });

        it("trims leading and trailing separators", () => {
            expect(deriveShortName("  __hello__  ")).toBe("HELLO");
        });

        it("truncates long names to the shortName max length", () => {
            const longName = "a".repeat(shortNameMaxLength + 20);
            expect(deriveShortName(longName).length).toBe(shortNameMaxLength);
        });
    });

    describe("deriveCode", () => {
        it("converts a plain name to upper snake case", () => {
            expect(deriveCode("Footnote National Policies")).toBe("FOOTNOTE_NATIONAL_POLICIES");
        });

        it("is not truncated unlike shortName", () => {
            const longName = "a".repeat(100);
            expect(deriveCode(longName).length).toBe(100);
        });
    });
});
