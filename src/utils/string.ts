/**
 * Removes the specified prefix from all words in the text.
 */
export function removePrefixFromWords(text: string, prefix: string): string {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedPrefix}`, "g");
    return text.replace(regex, "").trim();
}

// Replaces C0 control chars invalid in XML 1.0 with a space.
// Preserves \t, \n, \r (the only whitespace controls XML 1.0 allows).
// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function replaceInvalidXmlChars(text: string): string {
    return text.replace(INVALID_XML_CHARS_RE, " ");
}
