export type Period = {
    id: string;
    label: string;
};

export enum PeriodType {
    DAILY = "Daily",
    WEEKLY = "Weekly",
    MONTHLY = "Monthly",
    QUARTERLY = "Quarterly",
    YEARLY = "Yearly",
    UNKNOWN = "Unknown",
}

export function validatePeriodType(periodType: string): PeriodType {
    switch (periodType) {
        case PeriodType.DAILY:
        case PeriodType.WEEKLY:
        case PeriodType.MONTHLY:
        case PeriodType.QUARTERLY:
        case PeriodType.YEARLY:
            return periodType;
        default:
            return PeriodType.UNKNOWN;
    }
}
