import { DataValueStore } from "../DataValue";
import { dataElementText, dataValues, dataValueTextSingle, dataValueBase } from "./dataFixtures";

describe("DataValueStore", () => {
    describe("DataValueStore.from", () => {
        it("should create a DataValueStore from an array of DataValues", () => {
            const store = DataValueStore.from(dataValues);
            expect(store).toBeInstanceOf(DataValueStore);
            expect(store.store).toEqual({
                "1.202101.coc1.org1": dataValueTextSingle,
            });
        });
    });

    describe("DataValueStore.set", () => {
        it("should set a DataValue in the store", () => {
            const store = new DataValueStore({});
            const updatedStore = store.set(dataValueTextSingle);
            expect(updatedStore.store).toEqual({
                "1.202101.coc1.org1": dataValueTextSingle,
            });
        });
    });

    describe("DataValueStore.get", () => {
        it("should get a DataValue from the store", () => {
            const store = DataValueStore.from(dataValues);
            const dataValue = store.get(dataElementText, dataValueBase);
            expect(dataValue).toEqual(dataValueTextSingle);
        });
    });

    describe("DataValueStore.getOrEmpty", () => {
        it("should get a DataValue from the store", () => {
            const store = DataValueStore.from(dataValues);
            const dataValue = store.getOrEmpty(dataElementText, dataValueBase);
            expect(dataValue).toEqual(dataValueTextSingle);
        });

        it("should return an empty DataValue if not in the store", () => {
            const store = new DataValueStore({});
            const dataValue = store.getOrEmpty(dataElementText, dataValueBase);

            const emptyDataValue = { ...dataValueTextSingle, value: "" };
            expect(dataValue).toEqual(emptyDataValue);
        });
    });
});
