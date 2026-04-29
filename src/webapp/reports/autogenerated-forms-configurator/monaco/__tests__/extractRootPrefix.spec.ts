import { extractRootPrefix } from "../extractRootPrefix";

describe("extractRootPrefix", () => {
    describe("with valid JSON", () => {
        it("returns the prefix when set at the root", () => {
            expect(extractRootPrefix(`{"prefix":"TUB_","dataSets":{}}`)).toBe("TUB_");
        });

        it("returns the empty string when prefix is absent", () => {
            expect(extractRootPrefix(`{"dataSets":{}}`)).toBe("");
        });

        it("returns the empty string when prefix is empty", () => {
            expect(extractRootPrefix(`{"prefix":""}`)).toBe("");
        });

        it.each([
            ["number", `{"prefix":42}`],
            ["boolean", `{"prefix":true}`],
            ["null", `{"prefix":null}`],
            ["object", `{"prefix":{"nested":"x"}}`],
            ["array", `{"prefix":["a","b"]}`],
        ])("returns the empty string when prefix is a %s", (_label, input) => {
            expect(extractRootPrefix(input)).toBe("");
        });

        it("preserves escaped quotes in the prefix value", () => {
            expect(extractRootPrefix(`{"prefix":"A\\"B_"}`)).toBe(`A"B_`);
        });
    });

    describe("with malformed JSON (regex fallback)", () => {
        it("extracts the prefix from a string the parser cannot read yet", () => {
            const partial = `{"prefix":"TUB_","dataSets":{`;
            expect(extractRootPrefix(partial)).toBe("TUB_");
        });

        it("returns the empty string when prefix is missing in invalid JSON", () => {
            const partial = `{"dataSets":{`;
            expect(extractRootPrefix(partial)).toBe("");
        });

        it("returns the empty string for completely unreadable input", () => {
            expect(extractRootPrefix(`{prefix: TUB_}`)).toBe("");
        });

        // The regex fallback un-escapes any `\X` to `X`, so `\n` becomes `n` rather than
        // a newline. This is acceptable for ASCII prefixes (the supported character set);
        // any prefix that contains backslash escapes other than `\"` and `\\` will be
        // returned with those sequences flattened.
        it("un-escapes backslash sequences via the regex fallback", () => {
            const partial = `{"prefix":"A\\"B_","dataSets":{`;
            expect(extractRootPrefix(partial)).toBe(`A"B_`);
        });
    });
});
