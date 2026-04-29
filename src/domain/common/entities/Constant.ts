export const allowedLanguages = ["en", "es", "fr", "pt"] as const;
export type AllowedLanguage = typeof allowedLanguages[number];

type Translation = { property: "DESCRIPTION"; locale: AllowedLanguage; value: string };

export type Constant = {
    id: string;
    name: string;
    code: string;
    description: string;
    shortName: string;
    translations: Translation[];
    value: number;
};

export const shortNameMaxLength = 50;

export function deriveShortName(name: string): string {
    return toUpperSnake(name).slice(0, shortNameMaxLength);
}

export function deriveCode(name: string): string {
    return toUpperSnake(name);
}

function toUpperSnake(input: string): string {
    return input
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();
}
