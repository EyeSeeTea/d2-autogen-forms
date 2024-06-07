import { DataElement } from "../../../entities/DataElement";
import { DataValueFile, DataValueTextSingle } from "../../../entities/DataValue";

const dataElement: Omit<DataElement, "type"> = {
    id: "1",
    code: "DE1",
    name: "Element 1",
    categoryCombos: {
        id: "1",
        name: "Combo",
        categoryOptionCombos: [
            {
                id: "1",
                name: "Option Combo",
                shortName: "OC",
                formName: undefined,
            },
        ],
    },
    categoryOptionCombos: [],
    rules: [],
    htmlText: undefined,
    related: undefined,
};

export const dataValueText: DataValueTextSingle = {
    dataElement: { ...dataElement, type: "TEXT" },
    period: "202101",
    orgUnitId: "ou1",
    categoryOptionComboId: "coc1",
    isMultiple: false,
    type: "TEXT",
    value: "10",
};

export const dataValueFile: DataValueFile = {
    dataElement: { ...dataElement, type: "FILE" },
    period: "202101",
    orgUnitId: "ou1",
    categoryOptionComboId: "coc1",
    isMultiple: false,
    type: "FILE",
    file: {
        id: "1",
        name: "Test file",
        size: 1024,
        url: "/path/to/file",
    },
};
