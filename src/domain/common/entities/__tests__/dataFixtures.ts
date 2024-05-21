import { DataForm, SectionBase, defaultTexts } from "../DataForm";
import { DataElementText } from "../DataElement";
import { DataValue, DataValueBase, DataValueTextSingle } from "../DataValue";

export const dataElementText: DataElementText = {
    id: "1",
    code: "1",
    name: "Element 1",
    type: "TEXT",
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

export const sectionBase: Omit<SectionBase, "id" | "name" | "viewType"> = {
    toggle: { type: "none" },
    texts: defaultTexts,
    tabs: { active: true },
    sortRowsBy: "name",
    titleVariant: "h1",
    styles: { title: {}, columns: {}, rows: {}, totals: {} },
    columnsDescriptions: undefined,
    groupDescriptions: undefined,
    disableComments: false,
    showRowTotals: false,
    toggleMultiple: [],
    indicators: [],
    dataElements: [dataElementText],
};

export const dataFormBase: Omit<DataForm, "sections"> = {
    id: "1",
    expiryDays: 0,
    dataInputPeriods: [],
    dataElements: [],
    texts: defaultTexts,
    options: { dataElements: {} },
    indicators: [],
};

export const dataValueBase: DataValueBase = {
    orgUnitId: "org1",
    period: "202101",
    categoryOptionComboId: "coc1",
};

export const dataValueTextSingle: DataValueTextSingle = {
    ...dataValueBase,
    type: "TEXT",
    isMultiple: false,
    dataElement: dataElementText,
    value: "Sample text",
};

export const dataValues: DataValue[] = [dataValueTextSingle];
