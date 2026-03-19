import { DataValueStore } from "../DataValue";
import {
    dataElementText,
    dataValueBase,
    dataValueTextSingle,
    dataValueTextWithComment,
} from "./dataFixtures";

describe("Comment indicator", () => {
    describe("DataValue comment field", () => {
        it("should be undefined when data value has no comment", () => {
            expect(dataValueTextSingle.comment).toBeUndefined();
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

        it("should return undefined comment for data values without comments", () => {
            const store = DataValueStore.from([dataValueTextSingle]);
            const retrieved = store.get(dataElementText, dataValueBase);
            expect(retrieved?.comment).toBeUndefined();
        });

        it("should return undefined comment for empty data values", () => {
            const store = new DataValueStore({});
            const retrieved = store.getOrEmpty(dataElementText, dataValueBase);
            expect(retrieved.comment).toBeUndefined();
        });
    });

    describe("hasComment helper", () => {
        it("should return true when comment is a non-empty string", () => {
            expect(hasComment(dataValueTextWithComment)).toBe(true);
        });

        it("should return false when comment is undefined", () => {
            expect(hasComment(dataValueTextSingle)).toBe(false);
        });

        it("should return false when comment is an empty string", () => {
            const dvEmptyComment = { ...dataValueTextSingle, comment: "" };
            expect(hasComment(dvEmptyComment)).toBe(false);
        });
    });
});

function hasComment(dataValue: { comment?: string }): boolean {
    return !!dataValue.comment;
}
