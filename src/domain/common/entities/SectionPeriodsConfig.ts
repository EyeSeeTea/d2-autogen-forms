import _ from "lodash";
import { Maybe } from "../../../utils/ts-utils";
import { Code, Id } from "./Base";
import { ViewType } from "./DataForm";
import { SectionPeriod } from "./SectionPeriod";

const intervalViewTypes = ["grid-with-periods", "grid-indicators-calculated", "grid-with-cat-option-combos"] as const;
type IntervalViewType = typeof intervalViewTypes[number];

// These view types render one period: the dataset period, or a "section-offset" period.
const singlePeriodViewTypes = ["grid", "table"] as const;
type SinglePeriodViewType = typeof singlePeriodViewTypes[number];

// The form renders a section without a viewType as a table.
export const defaultSectionViewType: ViewType = "table";

type IssueLevel = "error" | "warning";

export type SectionPeriodsIssue = Readonly<{
    dataSetCode: Code;
    sectionId: Id;
    level: IssueLevel;
    message: string;
}>;

export type SectionPeriodsInput = Readonly<{ viewType?: ViewType; periods?: SectionPeriod }>;

type DataSetPeriodsInput = Readonly<{ viewType?: ViewType; sections?: Record<Id, SectionPeriodsInput> }>;

// AutogenConfig is assignable to this type. It names only the fields that the periods check reads.
export type PeriodsConfigInput = Readonly<{ dataSets: Record<Code, DataSetPeriodsInput | {}> }>;

type SectionIssue = Pick<SectionPeriodsIssue, "level" | "message">;

export function isIntervalViewType(viewType: ViewType): viewType is IntervalViewType {
    return _.includes(intervalViewTypes, viewType);
}

function isSinglePeriodViewType(viewType: ViewType): viewType is SinglePeriodViewType {
    return _.includes(singlePeriodViewTypes, viewType);
}

// A "relative-interval" that does not apply changes which period the user expects, so it is an error.
// A "section-offset" on a view type without periods is only ignored, so it is a warning.
export function getSectionPeriodsIssue(sectionId: Id, section: SectionPeriodsInput): Maybe<SectionIssue> {
    const viewType = section.viewType ?? defaultSectionViewType;
    const periodsType = section.periods?.type;
    if (!periodsType || isIntervalViewType(viewType)) return undefined;

    if (isSinglePeriodViewType(viewType)) {
        return periodsType === "relative-interval"
            ? {
                  level: "error",
                  message: `Section "${sectionId}" has viewType "${viewType}", which shows one period. A "relative-interval" periods config does not apply to it. Use viewType "grid-with-periods" to show several periods, or "section-offset" to move the section to another period.`,
              }
            : undefined;
    }

    return {
        level: periodsType === "relative-interval" ? "error" : "warning",
        message: `Section "${sectionId}" has viewType "${viewType}", which does not use a periods config. Remove "periods" from the section, or use viewType "grid-with-periods" to show several periods.`,
    };
}

export function getSectionPeriodsIssues(config: PeriodsConfigInput): ReadonlyArray<SectionPeriodsIssue> {
    return _.flatMap(config.dataSets, (dataSet, dataSetCode) =>
        _.flatMap(getSections(dataSet), (section, sectionId): SectionPeriodsIssue[] => {
            const viewType = section.viewType ?? getDataSetViewType(dataSet);
            const issue = getSectionPeriodsIssue(sectionId, { viewType, periods: section.periods });
            return issue ? [{ dataSetCode, sectionId, ...issue }] : [];
        })
    );
}

export function isSectionPeriodsError(issue: SectionPeriodsIssue): boolean {
    return issue.level === "error";
}

function getSections(dataSet: DataSetPeriodsInput | {}): Record<Id, SectionPeriodsInput> {
    return "sections" in dataSet ? dataSet.sections ?? {} : {};
}

function getDataSetViewType(dataSet: DataSetPeriodsInput | {}): Maybe<ViewType> {
    return "viewType" in dataSet ? dataSet.viewType : undefined;
}
