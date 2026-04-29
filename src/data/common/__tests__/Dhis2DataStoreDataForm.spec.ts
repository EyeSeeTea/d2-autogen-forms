import { DataStoreConfigCodec } from "../Dhis2DataStoreDataForm";

describe("DataStoreConfigCodec", () => {
    describe("showNavigation", () => {
        it("parses showNavigation as true when set to true in dataset config", () => {
            const input = buildConfigWithDataSet({ showNavigation: true });

            const result = DataStoreConfigCodec.decode(input);

            result.caseOf({
                Left: error => fail(`Decode failed: ${error}`),
                Right: config => {
                    expect(config.dataSets?.["DS_TEST"]?.showNavigation).toBe(true);
                },
            });
        });

        it("parses showNavigation as false when set to false in dataset config", () => {
            const input = buildConfigWithDataSet({ showNavigation: false });

            const result = DataStoreConfigCodec.decode(input);

            result.caseOf({
                Left: error => fail(`Decode failed: ${error}`),
                Right: config => {
                    expect(config.dataSets?.["DS_TEST"]?.showNavigation).toBe(false);
                },
            });
        });

        it("parses showNavigation as undefined when absent from dataset config", () => {
            const input = buildConfigWithDataSet({});

            const result = DataStoreConfigCodec.decode(input);

            result.caseOf({
                Left: error => fail(`Decode failed: ${error}`),
                Right: config => {
                    expect(config.dataSets?.["DS_TEST"]?.showNavigation).toBeUndefined();
                },
            });
        });

        it("decodes successfully when dataSets key is absent", () => {
            const input = {};

            const result = DataStoreConfigCodec.decode(input);

            result.caseOf({
                Left: error => fail(`Decode failed: ${error}`),
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
