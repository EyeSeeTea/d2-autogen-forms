import { Constant } from "./Constant";
import { ErrorReportEntry } from "./Stats";
import { Maybe } from "../../../utils/ts-utils";

export type ConstantField = keyof Pick<Constant, "name" | "shortName" | "code" | "description">;

export type ConstantSaveError = {
    readonly _tag: "ConstantSaveError";
    readonly reports: ReadonlyArray<ErrorReportEntry>;
    readonly message: string;
};

export function constantSaveError(reports: ReadonlyArray<ErrorReportEntry>): ConstantSaveError {
    return {
        _tag: "ConstantSaveError",
        reports,
        message: reports.map(report => report.message).join("\n") || "Unknown error",
    };
}

export function isConstantSaveError(value: unknown): value is ConstantSaveError {
    return typeof value === "object" && value !== null && (value as { _tag?: unknown })._tag === "ConstantSaveError";
}

export function fieldError(error: ConstantSaveError, field: ConstantField): Maybe<string> {
    return error.reports.find(report => report.errorProperty === field)?.message;
}
