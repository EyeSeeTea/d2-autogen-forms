import _ from "lodash";
import fs from "fs";

import { AllowedLanguage, allowedLanguages, Constant } from "../domain/common/entities/Constant";
import { ImportConstantRepository } from "../domain/common/repositories/ImportConstantRepository";
import { getUid } from "../utils/uid";
import { Maybe } from "../utils/ts-utils";
import { Translation } from "../domain/common/entities/Translation";

export class ImportConstantJsonRepository implements ImportConstantRepository {
    import(path: string): Constant[] {
        const translations = this.readTranslationFile(path);

        const constantsWithTranslations = _(translations)
            .flatMap((translation, key) => {
                const startWithMalaria = key.startsWith("MAL_");
                const constant = this.buildConstantByLanguage(startWithMalaria, key, translation, "en");
                const translations = _(allowedLanguages)
                    .map((languageKey): Maybe<Translation> => {
                        if (languageKey === "en") return undefined;
                        const value = translation[languageKey];
                        if (!value) throw Error(`Cannot found value for constant: ${key} in language ${languageKey}`);
                        return { property: "DESCRIPTION", locale: languageKey, value: value };
                    })
                    .compact()
                    .value();
                return { ...constant, translations };
            })
            .value();

        return constantsWithTranslations;
    }

    private buildConstantByLanguage(
        startWithMalaria: boolean,
        constantKey: string,
        translation: TranslationContent,
        languageKey: AllowedLanguage
    ): Constant {
        const malWmrPrefix = "MAL_WMR_";
        const name = startWithMalaria ? constantKey.replace("MAL_", malWmrPrefix) : `${malWmrPrefix}${constantKey}`;
        return {
            id: getUid(name),
            name: name,
            shortName: constantKey.substring(0, 50),
            code: constantKey.substring(0, 50),
            description: translation[languageKey],
            value: 0,
            translations: [],
        };
    }

    private readTranslationFile(path: string) {
        const translations = fs.readFileSync(path, { encoding: "utf-8" });
        return JSON.parse(translations) as TranslationImport;
    }
}

type TranslationImport = Record<string, TranslationContent>;
type TranslationContent = Record<AllowedLanguage, string>;
