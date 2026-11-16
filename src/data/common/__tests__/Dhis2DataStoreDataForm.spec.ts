import { PeriodType } from "../../../domain/common/entities/Period";
import { DataStoreConfigCodec, getSectionPeriods } from "../Dhis2DataStoreDataForm";

describe("DataStoreConfigCodec", () => {
    describe("showNavigation", () => {
        it("parses showNavigation as true when set to true in dataset config", () => {
            const input = buildConfigWithDataSet({ showNavigation: true });

            const result = DataStoreConfigCodec.decode(input);

            result.caseOf({
                Left: error => {
                    throw new Error(`Decode failed: ${error}`);
                },
                Right: config => {
                    expect(config.dataSets?.["DS_TEST"]?.showNavigation).toBe(true);
                },
            });
        });

        it("parses showNavigation as false when set to false in dataset config", () => {
            const input = buildConfigWithDataSet({ showNavigation: false });

            const result = DataStoreConfigCodec.decode(input);

            result.caseOf({
                Left: error => {
                    throw new Error(`Decode failed: ${error}`);
                },
                Right: config => {
                    expect(config.dataSets?.["DS_TEST"]?.showNavigation).toBe(false);
                },
            });
        });

        it("parses showNavigation as undefined when absent from dataset config", () => {
            const input = buildConfigWithDataSet({});

            const result = DataStoreConfigCodec.decode(input);

            result.caseOf({
                Left: error => {
                    throw new Error(`Decode failed: ${error}`);
                },
                Right: config => {
                    expect(config.dataSets?.["DS_TEST"]?.showNavigation).toBeUndefined();
                },
            });
        });

        it("decodes successfully when dataSets key is absent", () => {
            const input = {};

            const result = DataStoreConfigCodec.decode(input);

            result.caseOf({
                Left: error => {
                    throw new Error(`Decode failed: ${error}`);
                },
                Right: config => {
                    expect(config.dataSets).toBeUndefined();
                },
            });
        });
    });
});

function buildConfigWithDataSet(dataSetOverrides: Record<string, unknown>): object {
    return {
        dataSets: {
            DS_TEST: dataSetOverrides,
        },
    };
}

describe("getSectionPeriods", () => {
    const dataSetPeriod = "2025";
    const lastThreeYears = { type: "relative-interval", startOffset: -2, endOffset: 0 } as const;
    const lastThreeYearPeriods = [
        { id: "2023", label: "2023" },
        { id: "2024", label: "2024" },
        { id: "2025", label: "2025" },
    ];

    describe("relative-interval", () => {
        it.each(["grid", "table", "grid-with-totals"] as const)(
            "returns no periods for %s, so the section uses the dataset period",
            viewType => {
                expect(getSectionPeriods(viewType, dataSetPeriod, lastThreeYears, PeriodType.YEARLY)).toEqual([]);
            }
        );

        it.each(["grid-with-periods", "grid-indicators-calculated", "grid-with-cat-option-combos"] as const)(
            "returns every period in the interval for %s",
            viewType => {
                expect(getSectionPeriods(viewType, dataSetPeriod, lastThreeYears, PeriodType.YEARLY)).toEqual(
                    lastThreeYearPeriods
                );
            }
        );
    });

    describe("section-offset", () => {
        it.each(["grid", "table"] as const)("returns the offset period for %s", viewType => {
            const offset = { type: "section-offset", offset: -1 } as const;

            expect(getSectionPeriods(viewType, dataSetPeriod, offset, PeriodType.YEARLY)).toEqual([
                { id: "2024", label: "2024" },
            ]);
        });
    });

    describe("without periods config", () => {
        it("returns no periods", () => {
            expect(getSectionPeriods("grid", dataSetPeriod, undefined, PeriodType.YEARLY)).toEqual([]);
        });
    });
});
