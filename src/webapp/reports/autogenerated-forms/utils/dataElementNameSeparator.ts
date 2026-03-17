/**
 * Matches the data element label separator when the hyphen is surrounded
 * by either regular spaces or non-breaking spaces copied from external sources.
 */
export const DATA_ELEMENT_NAME_SEPARATOR = /[ \u00A0]-[ \u00A0]/;

/**
 * Variant used by period-based labels, which also accept `:` as a delimiter.
 */
export const PERIOD_NAME_SEPARATOR = /:|[ \u00A0]-[ \u00A0]/;

/**
 * Splits a data element label while accepting both normal spaces and NBSPs
 * around the hyphen separator.
 */
export function splitDataElementName(value: string): string[] {
    return value.split(DATA_ELEMENT_NAME_SEPARATOR);
}

const DATA_ELEMENT_NAME_SEPARATOR_TEXT = " - ";
/**
 * Rebuilds a parsed label using the normalized text separator expected by the UI.
 */
export function joinDataElementName(parts: string[]): string {
    return parts.join(DATA_ELEMENT_NAME_SEPARATOR_TEXT);
}

const indexedSubRowPrefix = new RegExp(`^\\d+\\.\\d+${DATA_ELEMENT_NAME_SEPARATOR.source}`);
/**
 * Detects indexed row prefixes such as `1.2 - Label`, including the NBSP variant.
 */
export function hasIndexedSubRowPrefix(value: string): boolean {
    return indexedSubRowPrefix.test(value);
}
