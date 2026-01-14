import _ from "lodash";
import { Code } from "./Base";
import { DataElement } from "./DataElement";
import { SectionBase } from "./DataForm";
import { Maybe } from "../../../utils/ts-utils";

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

                    const selectedDataElements = toggle.dataElements
                        ? sectionDataElements.filter(de => toggle.dataElements?.includes(de.code))
                        : sectionDataElements;

                    return selectedDataElements.map(dataElement => ({
                        type: toggle.type,
                        orgUnitCodes: toggle.orgUnits,
                        condition: toggle.condition,
                        dataElement: { ...dataElement, disabled: Boolean(toggle.disabled) },
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
                        dataElement: { ...dataElement, disabled: Boolean(toggle.disabled) },
                    };
                }
            }
        })
        .flatten()
        .compact()
        .value();

    return { toggleDataElements: toggleDataElements, logicalOperator: toggleMultiple.logicalOperator };
}

export function isToggleMultipleDeDisabled(
    section: SectionBase,
    dataElement: Maybe<DataElement>,
    orgUnitCode: string
): boolean {
    if (!dataElement || !section.toggleMultiple) return false;

    return section.toggleMultiple.toggleDataElements
        .filter(
            (toggle): toggle is OrgUnitToggle =>
                toggle.type === "orgUnit" && toggle.dataElement.code === dataElement.code
        )
        .some(toggle => {
            const { orgUnitCodes, condition, dataElement: toggleDe } = toggle;
            if (!toggleDe.disabled) return false;

            const isOrgUnitInToggleList = orgUnitCodes.includes(orgUnitCode);

            switch (condition) {
                case "show":
                    return !isOrgUnitInToggleList;
                case "hide":
                    return isOrgUnitInToggleList;
                default:
                    return false;
            }
        });
}
