import { ViewType } from "../DataForm";
import { SectionPeriod } from "../SectionPeriod";
import { getSectionPeriodsIssue, getSectionPeriodsIssues, PeriodsConfigInput } from "../SectionPeriodsConfig";

const DATA_SET_CODE = "MAL-PR-MF";
const SECTION_ID = "LBL_INSECTICIDE_USAGE";
const relativeInterval: SectionPeriod = { type: "relative-interval", startOffset: -2, endOffset: 0 };
const sectionOffset: SectionPeriod = { type: "section-offset", offset: -1 };

const intervalViewTypes = ["grid-with-periods", "grid-indicators-calculated", "grid-with-cat-option-combos"] as const;
const singlePeriodViewTypes = ["grid", "table"] as const;
const viewTypesWithoutPeriods = [
    "grid-with-totals",
    "grid-with-combos",
    "matrix-grid",
    "grid-disaggregated-cocs",
    "grid-with-subnational-ous",
    "grid-category-columns",
] as const;

function buildConfig(dataSet: PeriodsConfigInput["dataSets"][string]): PeriodsConfigInput {
    return { dataSets: { [DATA_SET_CODE]: dataSet } };
}

// Contract tests: the configurator and the browser console show these messages to the user.
function singlePeriodMessage(viewType: ViewType, sectionId = SECTION_ID): string {
    return `Section "${sectionId}" has viewType "${viewType}", which shows one period. A "relative-interval" periods config does not apply to it. Use viewType "grid-with-periods" to show several periods, or "section-offset" to move the section to another period.`;
}

function noPeriodsMessage(viewType: ViewType): string {
    return `Section "${SECTION_ID}" has viewType "${viewType}", which does not use a periods config. Remove "periods" from the section, or use viewType "grid-with-periods" to show several periods.`;
}

function getIssue(viewType: ViewType | undefined, periods?: SectionPeriod) {
    return getSectionPeriodsIssue(SECTION_ID, { viewType, periods });
}

describe("getSectionPeriodsIssue", () => {
    describe("interval view types", () => {
        it.each(intervalViewTypes)("accepts a relative-interval on %s", viewType => {
            expect(getIssue(viewType, relativeInterval)).toBeUndefined();
        });

        it.each(intervalViewTypes)("accepts a section-offset on %s", viewType => {
            expect(getIssue(viewType, sectionOffset)).toBeUndefined();
        });
    });

    describe("single-period view types", () => {
        it.each(singlePeriodViewTypes)("returns an error for a relative-interval on %s", viewType => {
            expect(getIssue(viewType, relativeInterval)).toEqual({
                level: "error",
                message: singlePeriodMessage(viewType),
            });
        });

        it.each(singlePeriodViewTypes)("accepts a section-offset on %s", viewType => {
            expect(getIssue(viewType, sectionOffset)).toBeUndefined();
        });

        it("treats a section without viewType as a table", () => {
            expect(getIssue(undefined, relativeInterval)).toEqual({
                level: "error",
                message: singlePeriodMessage("table"),
            });
        });
    });

    describe("view types without periods", () => {
        it.each(viewTypesWithoutPeriods)("returns an error for a relative-interval on %s", viewType => {
            expect(getIssue(viewType, relativeInterval)).toEqual({
                level: "error",
                message: noPeriodsMessage(viewType),
            });
        });

        it.each(viewTypesWithoutPeriods)("returns a warning for a section-offset on %s", viewType => {
            expect(getIssue(viewType, sectionOffset)).toEqual({
                level: "warning",
                message: noPeriodsMessage(viewType),
            });
        });
    });

    describe("without a periods config", () => {
        it.each([...singlePeriodViewTypes, ...viewTypesWithoutPeriods])("accepts %s", viewType => {
            expect(getIssue(viewType)).toBeUndefined();
        });
    });
});

describe("getSectionPeriodsIssues", () => {
    describe("viewType resolution", () => {
        it("uses the section viewType", () => {
            const config = buildConfig({ sections: { [SECTION_ID]: { viewType: "grid", periods: relativeInterval } } });

            expect(getSectionPeriodsIssues(config)).toEqual([
                {
                    dataSetCode: DATA_SET_CODE,
                    sectionId: SECTION_ID,
                    level: "error",
                    message: singlePeriodMessage("grid"),
                },
            ]);
        });

        it("uses the dataset viewType when the section has no viewType", () => {
            const config = buildConfig({ viewType: "grid", sections: { [SECTION_ID]: { periods: relativeInterval } } });

            expect(getSectionPeriodsIssues(config)).toEqual([
                {
                    dataSetCode: DATA_SET_CODE,
                    sectionId: SECTION_ID,
                    level: "error",
                    message: singlePeriodMessage("grid"),
                },
            ]);
        });

        it("prefers the section viewType over the dataset viewType", () => {
            const config = buildConfig({
                viewType: "grid",
                sections: { [SECTION_ID]: { viewType: "grid-with-periods", periods: relativeInterval } },
            });

            expect(getSectionPeriodsIssues(config)).toEqual([]);
        });
    });

    describe("dataset structure", () => {
        it("returns no issues for an empty dataset config", () => {
            expect(getSectionPeriodsIssues(buildConfig({}))).toEqual([]);
        });

        it("returns one issue per section across datasets", () => {
            const otherDataSetCode = "MAL-PR-OTHER";
            const config: PeriodsConfigInput = {
                dataSets: {
                    [DATA_SET_CODE]: { sections: { [SECTION_ID]: { viewType: "table", periods: relativeInterval } } },
                    [otherDataSetCode]: {
                        sections: { [SECTION_ID]: { viewType: "matrix-grid", periods: sectionOffset } },
                    },
                },
            };

            expect(getSectionPeriodsIssues(config)).toEqual([
                {
                    dataSetCode: DATA_SET_CODE,
                    sectionId: SECTION_ID,
                    level: "error",
                    message: singlePeriodMessage("table"),
                },
                {
                    dataSetCode: otherDataSetCode,
                    sectionId: SECTION_ID,
                    level: "warning",
                    message: noPeriodsMessage("matrix-grid"),
                },
            ]);
        });
    });
});
