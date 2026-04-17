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
