import { Id } from "../../common/entities/Base";
import { CustomFormRepository } from "../repositories/CustomFormRepository";

export type CustomFormInstallState =
    | { type: "not-installed" }
    | { type: "installed"; version: string }
    | { type: "outdated"; installedVersion: string; bundledVersion: string }
    | { type: "unknown-version" };

const VERSION_MARKER_RE = /<!-- d2-autogen-forms-custom-form v([^\s]+) -->/;

export function parseVersionMarker(html: string): string | null {
    return html.match(VERSION_MARKER_RE)?.[1] ?? null;
}

export class GetInstallStateUseCase {
    constructor(private customFormRepository: CustomFormRepository) {}

    async execute(dataSetId: Id, bundledHtml: string): Promise<CustomFormInstallState> {
        const installedHtml = await this.customFormRepository.getInstalledHtml(dataSetId);

        if (!installedHtml) return { type: "not-installed" };

        const installedVersion = parseVersionMarker(installedHtml);
        if (!installedVersion) return { type: "unknown-version" };

        const bundledVersion = parseVersionMarker(bundledHtml);
        if (!bundledVersion) return { type: "unknown-version" };

        return installedVersion === bundledVersion
            ? { type: "installed", version: installedVersion }
            : { type: "outdated", installedVersion, bundledVersion };
    }
}
