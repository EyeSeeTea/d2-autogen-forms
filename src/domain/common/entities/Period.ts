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
            throw new Error(`Invalid period type: ${periodType}`);
    }
}
