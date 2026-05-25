/**
 * Returns the JSON property path of the string value at `offset` in `text`,
 * or `undefined` if the offset is not inside a string value.
 *
 * The walker is intentionally forgiving — it handles partial/invalid JSON
 * (as typed while editing) by walking backward from the cursor and never
 * looking forward. It is not a full JSON parser; it only answers
 * "what is the path of the string I am inside?".
 *
 * Example: for input {"a": {"b": "x|"}} (cursor after x), returns ["a", "b"].
 */
export function getJsonPathAtCursor(text: string, offset: number): string[] | undefined {
    if (!isInsideStringValue(text, offset)) return undefined;
    const stringStart = findEnclosingStringStart(text, offset);
    if (stringStart === -1) return undefined;

    const immediateKey = findKeyBefore(text, stringStart);
    if (immediateKey === undefined) return undefined;

    const ancestors = collectAncestorKeys(text, stringStart);
    return [...ancestors, immediateKey];
}

export function isInlineConstantCodePosition(text: string, offset: number): boolean {
    const path = getJsonPathAtCursor(text, offset);
    if (!path || path.length < 3) return false;
    if (path[path.length - 1] !== "code") return false;
    return path.slice(0, -2).includes("texts");
}

function isInsideStringValue(text: string, offset: number): boolean {
    let inString = false;
    let escaped = false;
    for (let i = 0; i < offset; i++) {
        const ch = text[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (ch === "\\") {
            escaped = true;
            continue;
        }
        if (ch === '"') inString = !inString;
    }
    return inString;
}

function findEnclosingStringStart(text: string, offset: number): number {
    let escaped = false;
    let stringStart = -1;
    for (let i = 0; i < offset; i++) {
        const ch = text[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (ch === "\\") {
            escaped = true;
            continue;
        }
        if (ch === '"') {
            stringStart = stringStart === -1 ? i : -1;
        }
    }
    return stringStart;
}

function findKeyBefore(text: string, stringStart: number): string | undefined {
    let i = skipWhitespaceBackward(text, stringStart - 1);
    if (i < 0 || text[i] !== ":") return undefined;
    i = skipWhitespaceBackward(text, i - 1);
    if (i < 0 || text[i] !== '"') return undefined;
    return readStringEndingAt(text, i);
}

function collectAncestorKeys(text: string, fromOffset: number): string[] {
    const keys: string[] = [];
    let i = fromOffset - 1;
    let depth = 0;
    while (i >= 0) {
        const ch = text[i];
        if (ch === '"') {
            const stringStart = findMatchingOpenQuote(text, i);
            i = stringStart - 1;
            continue;
        }
        if (ch === "}" || ch === "]") {
            depth++;
            i--;
            continue;
        }
        if (ch === "{" || ch === "[") {
            if (depth > 0) {
                depth--;
                i--;
                continue;
            }
            if (ch === "{") {
                const parentKey = findKeyBefore(text, i);
                if (parentKey === undefined) return keys;
                keys.unshift(parentKey);
            }
            i--;
            continue;
        }
        i--;
    }
    return keys;
}

function findMatchingOpenQuote(text: string, closingQuoteIndex: number): number {
    let i = closingQuoteIndex - 1;
    while (i >= 0) {
        if (text[i] === '"' && !isEscaped(text, i)) return i;
        i--;
    }
    return 0;
}

function readStringEndingAt(text: string, closingQuoteIndex: number): string | undefined {
    const openingQuote = findMatchingOpenQuote(text, closingQuoteIndex);
    if (openingQuote >= closingQuoteIndex) return undefined;
    return text.slice(openingQuote + 1, closingQuoteIndex);
}

function skipWhitespaceBackward(text: string, fromIndex: number): number {
    let i = fromIndex;
    while (i >= 0 && /\s/.test(text[i] ?? "")) i--;
    return i;
}

function isEscaped(text: string, index: number): boolean {
    let backslashes = 0;
    let i = index - 1;
    while (i >= 0 && text[i] === "\\") {
        backslashes++;
        i--;
    }
    return backslashes % 2 === 1;
}
