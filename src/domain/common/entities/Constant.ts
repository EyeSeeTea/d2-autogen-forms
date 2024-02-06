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
