import { DataValueStore, hasComment } from "../DataValue";
import { dataElementText, dataValueBase, dataValueTextSingle, dataValueTextWithComment } from "./dataFixtures";

describe("Comment indicator", () => {
    describe("DataValue comment field", () => {
        it("should be an empty string when data value has no comment", () => {
            expect(dataValueTextSingle.comment).toEqual("");
        });

        it("should contain the comment string when data value has a comment", () => {
            expect(dataValueTextWithComment.comment).toEqual("This value needs review");
        });
    });

    describe("DataValueStore with comments", () => {
        it("should preserve comment when storing a data value with a comment", () => {
            const store = DataValueStore.from([dataValueTextWithComment]);
            const retrieved = store.get(dataElementText, dataValueBase);
            expect(retrieved?.comment).toEqual("This value needs review");
        });

        it("should return empty string comment for data values without comments", () => {
            const store = DataValueStore.from([dataValueTextSingle]);
            const retrieved = store.get(dataElementText, dataValueBase);
            expect(retrieved?.comment).toEqual("");
        });

        it("should return empty string comment for empty data values", () => {
            const store = new DataValueStore({});
            const retrieved = store.getOrEmpty(dataElementText, dataValueBase);
            expect(retrieved.comment).toEqual("");
        });
    });

    describe("hasComment", () => {
        it("should return true when comment is a non-empty string", () => {
            expect(hasComment(dataValueTextWithComment)).toBe(true);
        });

        it("should return false when comment is an empty string", () => {
            expect(hasComment(dataValueTextSingle)).toBe(false);
        });
    });
});
