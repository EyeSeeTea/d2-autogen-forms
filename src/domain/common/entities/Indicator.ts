import { Maybe } from "../../../utils/ts-utils";
import { Code, Id } from "./Base";

export type Indicator = {
    id: Id;
    code: string;
    description: string;
    formula: string;
    dataElement: Maybe<{ code: Code; direction: IndicatorDirection }>;
};

export function checkIndicatorDirection(indicator: Indicator, direction: IndicatorDirection): boolean {
    return indicator.dataElement?.direction === direction;
}

export function getIndicatorRelatedToDataElement(indicators: Indicator[], code: Code): Maybe<Indicator> {
    return indicators.find(indicator => indicator.dataElement?.code === code);
}

export type IndicatorDirection = "after" | "before";
