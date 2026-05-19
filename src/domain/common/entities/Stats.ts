export type ErrorReportEntry = {
    message: string;
    errorCode: string;
    errorProperty: string;
};

type StatsAttrs = {
    created: number;
    ignored: number;
    updated: number;
    deleted: number;
    errorMessage: string;
    errorReports?: readonly ErrorReportEntry[];
};

export class Stats {
    public readonly created: number;
    public readonly ignored: number;
    public readonly updated: number;
    public readonly deleted: number;
    public readonly errorMessage: string;
    public readonly errorReports: readonly ErrorReportEntry[];

    constructor(attrs: StatsAttrs) {
        this.created = attrs.created;
        this.ignored = attrs.ignored;
        this.updated = attrs.updated;
        this.deleted = attrs.deleted;
        this.errorMessage = attrs.errorMessage;
        this.errorReports = attrs.errorReports ?? [];
    }

    static combine(stats: Stats[]): Stats {
        return stats.reduce(
            (acum, stat) =>
                new Stats({
                    errorMessage: [acum.errorMessage, stat.errorMessage].filter(Boolean).join("\n"),
                    created: acum.created + stat.created,
                    ignored: acum.ignored + stat.ignored,
                    updated: acum.updated + stat.updated,
                    deleted: acum.deleted + stat.deleted,
                    errorReports: [...acum.errorReports, ...stat.errorReports],
                }),
            Stats.empty()
        );
    }

    static empty(): Stats {
        return new Stats({ deleted: 0, errorMessage: "", created: 0, ignored: 0, updated: 0 });
    }
}
