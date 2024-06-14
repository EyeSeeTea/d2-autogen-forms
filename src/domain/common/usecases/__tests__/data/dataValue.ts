import { DataElement } from "../../../entities/DataElement";
import {
    DataValueFile,
    DataValueTextSingle,
    DataValueTextMultiple,
    DataValueNumberSingle,
} from "../../../entities/DataValue";

export const dataElement: Omit<DataElement, "type"> = {
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

export const dataValueTextMultiple: DataValueTextMultiple = {
    dataElement: { ...dataElement, id: "de1", code: "de1", type: "TEXT" },
    period: "202101",
    orgUnitId: "ou1",
    categoryOptionComboId: "coc1",
    values: ["value1", "value2"],
    type: "TEXT",
    isMultiple: true,
};

export const dataValueNumberSingle: DataValueNumberSingle = {
    dataElement: {
        ...dataElement,
        id: "de2",
        code: "de2",
        name: "Data Element 2",
        type: "NUMBER",
        numberType: "NUMBER",
    },
    period: "202101",
    orgUnitId: "ou1",
    categoryOptionComboId: "coc1",
    value: "10",
    type: "NUMBER",
    isMultiple: false,
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
