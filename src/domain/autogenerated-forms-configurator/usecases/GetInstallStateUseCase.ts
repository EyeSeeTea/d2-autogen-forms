import { Id } from "../../common/entities/Base";
import { CustomFormRepository } from "../repositories/CustomFormRepository";

export type CustomFormInstallState =
    | { type: "not-installed" }
    | { type: "installed"; version: string }
    | { type: "outdated"; installedVersion: string | null; bundledVersion: string };
// installedVersion === null means a custom form exists but has no version marker

const VERSION_MARKER_RE = /<!-- d2-autogen-forms-custom-form v([^\s]+) -->/;

export function parseVersionMarker(html: string): string | null {
    return html.match(VERSION_MARKER_RE)?.[1] ?? null;
}

export class GetInstallStateUseCase {
    constructor(private customFormRepository: CustomFormRepository) {}

    async execute(dataSetId: Id, bundledHtml: string): Promise<CustomFormInstallState> {
        const customForm = await this.customFormRepository.get(dataSetId);

        if (!customForm.htmlCode) return { type: "not-installed" };

        const installedVersion = parseVersionMarker(customForm.htmlCode);
        const bundledVersion = parseVersionMarker(bundledHtml);

        if (!bundledVersion) return { type: "outdated", installedVersion, bundledVersion: "unknown" };

        if (!installedVersion) return { type: "outdated", installedVersion: null, bundledVersion };

        return installedVersion === bundledVersion
            ? { type: "installed", version: installedVersion }
            : { type: "outdated", installedVersion, bundledVersion };
    }
}
