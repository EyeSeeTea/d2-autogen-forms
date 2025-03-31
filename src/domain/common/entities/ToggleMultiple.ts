import _ from "lodash";
import { Code } from "./Base";
import { DataElement } from "./DataElement";

type ToggleLogicalOperator = "AND" | "OR";
export type ToggleMultiple = {
    logicalOperator: ToggleLogicalOperator;
    conditions: { dataElement: Code; condition: string }[];
};
export type ToggleDataElement = {
    dataElement: DataElement;
    condition: string;
};
export type DataElementToggle = {
    logicalOperator: ToggleLogicalOperator;
    toggleDataElements: ToggleDataElement[];
};

export function buildToggleMultiple(
    toggleMultiple: ToggleMultiple,
    dataElements: Record<string, DataElement>
): DataElementToggle {
    const allDataElements = _(dataElements)
        .map(value => value)
        .value();

    const toggleDataElements = _(toggleMultiple.conditions)
        .map(toggle => {
            const dataElement = allDataElements.find(dataElement => dataElement.code === toggle.dataElement);
            if (!dataElement) {
                console.warn(`Cannot found ${toggle.dataElement} in toggleMultiple config.`);
                return undefined;
            }
            return {
                condition: toggle.condition,
                dataElement: dataElement,
            };
        })
        .compact()
        .value();

    return { toggleDataElements: toggleDataElements, logicalOperator: toggleMultiple.logicalOperator };
}
