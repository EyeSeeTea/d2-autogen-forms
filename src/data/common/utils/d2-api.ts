import _ from "lodash";
import { D2Api, MetadataResponse } from "../../../types/d2-api";
import { Instance } from "../entities/Instance";

export function getMajorVersion(version: string): number {
    const apiVersion = _.get(version.split("."), 1);
    if (!apiVersion) throw new Error(`Invalid version: ${version}`);
    return Number(apiVersion);
}

export function getD2APiFromInstance(instance: Instance) {
    return new D2Api({ baseUrl: instance.url, auth: instance.auth, backend: "fetch" });
}

export function getErrorFromResponse(typeReports: MetadataResponse["typeReports"]): string {
    return _(typeReports)
        .flatMap(typeReport => typeReport.objectReports || [])
        .flatMap(objectReport => objectReport.errorReports || [])
        .flatMap(errorReport => errorReport.message)
        .compact()
        .uniq()
        .join("\n");
}
