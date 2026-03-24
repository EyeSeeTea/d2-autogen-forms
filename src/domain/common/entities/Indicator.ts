import { Maybe } from "../../../utils/ts-utils";
import { Code, Id } from "./Base";
import { SectionBase } from "./DataForm";

export type Indicator = {
    id: Id;
    name: string;
    code: string;
    description: string;
    formula: string;
    dataElement: Maybe<{ code: Code; direction: IndicatorDirection }>;
};

export function checkIndicatorDirection(indicator: Indicator, direction: IndicatorDirection): boolean {
    return indicator.dataElement?.direction === direction;
}

export function isNonDirectionalIndicator(indicator: Indicator): boolean {
    return !checkIndicatorDirection(indicator, "before") && !checkIndicatorDirection(indicator, "after");
}

export function getIndicatorRelatedToDataElement(indicators: Indicator[], code: Code): Maybe<Indicator> {
    return indicators.find(indicator => indicator.dataElement?.code === code);
}

export function getNonDirectionalIndicatorsCountAtSectionStart(section: SectionBase): number {
    return section.indicatorsConfig.position === "start"
        ? section.indicators.filter(indicator => isNonDirectionalIndicator(indicator)).length
        : 0;
}

export type IndicatorDirection = "after" | "before";
