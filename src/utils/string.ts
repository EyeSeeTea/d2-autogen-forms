/**
 * Removes the specified prefix from all words in the text.
 */
export function removePrefixFromWords(text: string, prefix: string): string {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedPrefix}`, "g");
    return text.replace(regex, "").trim();
}
