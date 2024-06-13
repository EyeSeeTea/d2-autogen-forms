import { DataForm } from "../../../entities/DataForm";

export const dataForm: Omit<DataForm, "id"> = {
    expiryDays: 30,
    dataInputPeriods: [],
    dataElements: [],
    sections: [],
    texts: {
        header: undefined,
        footer: undefined,
        rowTotals: undefined,
        totals: undefined,
        name: undefined,
    },
    options: {
        dataElements: {
            de1: { widget: "dropdown" },
        },
    },
    indicators: [],
};
