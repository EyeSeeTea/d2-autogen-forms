import { Indicator } from "../Indicator";

export const indicatorAfter: Indicator = {
    id: "1",
    code: "IND_1",
    description: "Indicator 1",
    formula: "formula_1",
    dataElement: { code: "DE_1", direction: "after" },
};

export const indicatorBefore: Indicator = {
    id: "2",
    code: "IND_2",
    description: "Indicator 2",
    formula: "formula_2",
    dataElement: { code: "DE_2", direction: "before" },
};

export const indicators: Indicator[] = [indicatorAfter, indicatorBefore];
