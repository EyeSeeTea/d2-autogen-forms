import { getJsonPathAtCursor, isInlineConstantCodePosition } from "../jsonPathAtCursor";

describe("getJsonPathAtCursor", () => {
    it("returns the path for a top-level string value", () => {
        const text = `{"header": "|"}`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toEqual(["header"]);
    });

    it("returns the path inside a nested object", () => {
        const text = `{"texts": {"header": {"code": "|"}}}`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toEqual(["texts", "header", "code"]);
    });

    it("returns undefined when the cursor is outside any string", () => {
        const text = `{"a": 1, |}`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toBeUndefined();
    });

    it("returns undefined when the cursor is inside a key, not a value", () => {
        const text = `{"texts": {"co|de": "x"}}`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toBeUndefined();
    });

    it("handles sibling objects correctly", () => {
        const text = `{"tabs": {}, "texts": {"rowTotals": {"code": "|"}}}`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toEqual(["texts", "rowTotals", "code"]);
    });
});

describe("isInlineConstantCodePosition", () => {
    it.each([
        [`{"texts": {"header": {"code": "|"}}}`, true],
        [`{"texts": {"footer": {"code": "|"}}}`, true],
        [`{"texts": {"rowTotals": {"code": "|"}}}`, true],
        [`{"texts": {"deep": {"nested": {"code": "|"}}}}`, true],
        [`{"dataElement": {"code": "|"}}`, false],
        [`{"texts": {"header": {"name": "|"}}}`, false],
        [`{"texts": {"code": "|"}}`, false],
    ])("%s → %s", (template, expected) => {
        expect(isInlineConstantCodePosition(template, template.indexOf("|"))).toBe(expected);
    });
});

describe("getJsonPathAtCursor — edge cases", () => {
    it("handles strings with escaped quotes", () => {
        const text = `{"texts": {"header": {"label": "a\\"b", "code": "|"}}}`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toEqual(["texts", "header", "code"]);
    });

    it("handles deeply nested objects", () => {
        const text = `{"a":{"b":{"c":{"d":{"e":{"texts":{"x":{"code":"|"}}}}}}}}`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toEqual([
            "a",
            "b",
            "c",
            "d",
            "e",
            "texts",
            "x",
            "code",
        ]);
    });

    it("returns the path even when the surrounding JSON is malformed (trailing comma)", () => {
        const text = `{"texts": {"header": {"code": "|",}}}`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toEqual(["texts", "header", "code"]);
    });

    it("returns the path even when the surrounding JSON is mid-typed and unbalanced", () => {
        const text = `{"texts": {"header": {"code": "|"`;
        expect(getJsonPathAtCursor(text, text.indexOf("|"))).toEqual(["texts", "header", "code"]);
    });
});

describe("isInlineConstantCodePosition — array under texts", () => {
    // The walker skips array ancestors (it only collects keys of enclosing
    // objects), so `texts -> [...]` does not surface "texts" as an ancestor.
    // Documented here so a future change can revisit it intentionally.
    it("does not currently surface `texts` when `code` is inside an array element", () => {
        const text = `{"texts": [{"code": "|"}]}`;
        expect(isInlineConstantCodePosition(text, text.indexOf("|"))).toBe(false);
    });
});
