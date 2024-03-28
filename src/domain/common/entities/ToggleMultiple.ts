import _ from "lodash";
import { Maybe } from "../../../utils/ts-utils";

import { Code } from "./Base";
import { DataElement } from "./DataElement";

export type ToggleMultiple = { dataElement: Code; condition: string };
export type DataElementToggle = { dataElement: DataElement; condition: string };

export function buildToggleMultiple(
    toggleMultiple: ToggleMultiple[],
    dataElements: Record<string, DataElement>
): DataElementToggle[] {
    const allDataElements = _(dataElements)
        .map(value => value)
        .value();

    const toggleDataElements = _(toggleMultiple)
        .map((toggle): Maybe<DataElementToggle> => {
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

    return toggleDataElements;
}
