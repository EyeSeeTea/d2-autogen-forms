import { Dhis2DataValueRepository } from "../Dhis2DataValueRepository";
import { D2Api } from "../../../types/d2-api";
import { dataValueText, dataValueTextMultiple } from "../../../domain/common/usecases/__tests__/data/dataValue";

const dataSetId = "dataSet1";

describe("Dhis2DataValueRepository", () => {
    describe("save", () => {
        it("sends ds so DHIS2 v43 can resolve the dataset for data elements shared across datasets", async () => {
            const postMock = vi.fn().mockReturnValue({ getData: () => Promise.resolve() });
            const api = { dataValues: { post: postMock } } as unknown as D2Api;

            await new Dhis2DataValueRepository(api).save(dataValueText, dataSetId);

            expect(postMock).toHaveBeenCalledWith(
                expect.objectContaining({ ds: dataSetId, de: dataValueText.dataElement.id, value: "10" })
            );
        });
    });

    describe("delete", () => {
        it("sends dataSet so DHIS2 v43 can resolve the dataset for data elements shared across datasets", async () => {
            const postSetMock = vi.fn().mockReturnValue({ getData: () => Promise.resolve() });
            const api = { dataValues: { postSet: postSetMock } } as unknown as D2Api;

            await new Dhis2DataValueRepository(api).delete([dataValueText], dataSetId);

            expect(postSetMock).toHaveBeenCalledWith(
                { importStrategy: "DELETE" },
                expect.objectContaining({ dataSet: dataSetId })
            );
        });
    });

    describe("applyToAll", () => {
        it("sends dataSet so DHIS2 v43 can resolve the dataset for data elements shared across datasets", async () => {
            const postSetAsyncMock = vi.fn().mockReturnValue({ getData: () => Promise.resolve({ status: "OK" }) });
            const api = { dataValues: { postSetAsync: postSetAsyncMock } } as unknown as D2Api;

            await new Dhis2DataValueRepository(api).applyToAll(
                dataValueTextMultiple,
                [{ id: "de2", name: "Data Element 2" }],
                dataSetId
            );

            expect(postSetAsyncMock).toHaveBeenCalledWith({}, expect.objectContaining({ dataSet: dataSetId }));
        });
    });
});
