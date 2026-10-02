import { Dhis2CustomFormRepository } from "../Dhis2CustomFormRepository";
import { D2Api } from "../../../types/d2-api";

describe("Dhis2CustomFormRepository", () => {
    describe("install", () => {
        it("posts to the dedicated form endpoint without touching dataset metadata", async () => {
            const postMock = vi.fn().mockReturnValue({ getData: () => Promise.resolve() });
            const metadataPostMock = vi.fn();
            const api = { post: postMock, metadata: { post: metadataPostMock } } as unknown as D2Api;

            await new Dhis2CustomFormRepository(api).install("dataSetId123", "<html/>");

            expect(postMock).toHaveBeenCalledWith(
                "/dataSets/dataSetId123/form",
                {},
                { htmlCode: "<html/>", style: "NORMAL" }
            );
            expect(metadataPostMock).not.toHaveBeenCalled();
        });
    });
});
