import _ from "lodash";
import { Code } from "./Base";
import { DataElement } from "./DataElement";

export type ToggleLogicalOperator = "AND" | "OR";
type DataElementToggleMultiple = {
    type: "dataElement";
    dataElement: Code;
    condition: string;
    disabled?: boolean;
};
type OrgUnitToggleMultiple = {
    type: "orgUnit";
    orgUnits: string[];
    condition: string;
    disabled?: boolean;
    dataElements?: string[];
};
export type ToggleMultipleCondition = DataElementToggleMultiple | OrgUnitToggleMultiple;

export type ToggleMultiple = {
    logicalOperator: ToggleLogicalOperator;
    conditions: ToggleMultipleCondition[];
};

export type ToggleDataElement = {
    dataElement: DataElement;
    condition: string;
};

type DEToggle = { type: "dataElement" } & ToggleDataElement;
type OrgUnitToggle = { type: "orgUnit"; orgUnitCodes: string[] } & ToggleDataElement;

export type DataElementToggle = {
    logicalOperator: ToggleLogicalOperator;
    toggleDataElements: Array<DEToggle | OrgUnitToggle>;
};

export function buildToggleMultiple(
    toggleMultiple: ToggleMultiple,
    section: { dataElements: { code: Code }[] },
    dataElements: Record<string, DataElement>
): DataElementToggle {
    const allDataElements = _(dataElements)
        .map(value => value)
        .value();

    const toggleDataElements = _(toggleMultiple.conditions)
        .map(toggle => {
            switch (toggle.type) {
                case "orgUnit": {
                    const sectionDataElementCodes = section.dataElements.map(de => de.code);
                    const sectionDataElements = allDataElements.filter(de => sectionDataElementCodes.includes(de.code));

                    return sectionDataElements.map(dataElement => ({
                        type: toggle.type,
                        orgUnitCodes: toggle.orgUnits,
                        condition: toggle.condition,
                        dataElement: { ...dataElement, disabled: toggle.disabled },
                    }));
                }
                case "dataElement": {
                    const dataElement = allDataElements.find(dataElement => dataElement.code === toggle.dataElement);
                    if (!dataElement) {
                        console.warn(`Cannot found ${toggle.dataElement} in toggleMultiple config.`);
                        return undefined;
                    }

                    return {
                        type: toggle.type,
                        condition: toggle.condition,
                        dataElement: { ...dataElement, disabled: toggle.disabled },
                    };
                }
            }
        })
        .flatten()
        .compact()
        .value();

    return { toggleDataElements: toggleDataElements, logicalOperator: toggleMultiple.logicalOperator };
}
