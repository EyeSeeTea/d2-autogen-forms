import { Constant } from "./Constant";
import { ErrorReportEntry } from "./Stats";

type ConstantField = keyof Pick<Constant, "name" | "shortName" | "code" | "description">;

export class ConstantSaveError extends Error {
    public readonly reports: readonly ErrorReportEntry[];

    constructor(reports: readonly ErrorReportEntry[]) {
        const message = reports.map(report => report.message).join("\n") || "Unknown error";
        super(message);
        this.name = "ConstantSaveError";
        this.reports = reports;
    }

    fieldError(field: ConstantField): string | undefined {
        return this.reports.find(report => report.errorProperty === field)?.message;
    }
}
