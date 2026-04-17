/**
 * Reads the top-level `"prefix": "..."` string from the given JSON text.
 * Returns `""` if the field is absent, empty, not a string, or unreadable
 * (e.g., while the user is mid-edit and the JSON is temporarily invalid).
 *
 * Tries `JSON.parse` first for correctness; falls back to a regex for
 * the case where the surrounding JSON isn't yet valid.
 */
export function extractRootPrefix(jsonText: string): string {
    try {
        const parsed = JSON.parse(jsonText);
        if (parsed && typeof parsed === "object" && typeof parsed.prefix === "string") {
            return parsed.prefix;
        }
        return "";
    } catch {
        const match = jsonText.match(/"prefix"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const captured = match?.[1];
        return captured ? captured.replace(/\\(.)/g, "$1") : "";
    }
}
