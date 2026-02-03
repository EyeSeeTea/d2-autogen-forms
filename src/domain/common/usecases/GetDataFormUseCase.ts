import { Id } from "@eyeseetea/d2-api";
import { Period } from "../entities/DataValue";
import { DataFormRepository } from "../repositories/DataFormRepository";
import { OrgUnitsRepository } from "../repositories/OrgUnitsRepository";
import { DataForm, Section } from "../entities/DataForm";
import _ from "lodash";
import { OrgUnit } from "../entities/OrgUnit";
import { DataElement } from "../entities/DataElement";
import { OrgUnitToggle } from "../entities/AutogenConfig";

export class GetDataFormUseCase {
    constructor(private dataFormRepository: DataFormRepository, private orgUnitsRepository: OrgUnitsRepository) {}

    async execute(options: {
        dataSetId: Id;
        period: Period;
        orgUnitId: Id;
    }): Promise<{ dataForm: DataForm; orgUnit: OrgUnit }> {
        const orgUnit = await this.orgUnitsRepository.getById(options.orgUnitId);
        const dataForm = await this.dataFormRepository.get({
            id: options.dataSetId,
            period: options.period,
            orgUnitId: options.orgUnitId,
        });

        const sections = this.getSections(dataForm, orgUnit);

        return {
            dataForm: {
                ...dataForm,
                sections: sections,
            },
            orgUnit: orgUnit,
        };
    }

    private getSections(dataForm: DataForm, orgUnit: OrgUnit): Section[] {
        const { code: orgUnitCode, name: orgUnitName } = orgUnit;
        const { sections } = dataForm;

        if (!orgUnitCode) {
            console.warn(
                `Organization unit ${orgUnitName} has no code. ` +
                    `Cannot evaluate orgUnit toggle for the sections. Defaulting to visible.`
            );
            return sections;
        }

        return _(sections)
            .flatMap(section => {
                const { dataElements, toggle } = section;

                if (toggle.type === "orgUnit") {
                    const isOrgUnitInToggleList = toggle.orgUnits.includes(orgUnitCode);

                    if (toggle.dataElements.length === 0) {
                        switch (toggle.condition) {
                            case "hide": {
                                if (isOrgUnitInToggleList) {
                                    if (toggle.disabled) {
                                        return {
                                            ...section,
                                            dataElements: dataElements.map(de => ({ ...de, disabled: true })),
                                        };
                                    }
                                    return { ...section, hidden: true };
                                }
                                return section;
                            }
                            case "show": {
                                if (isOrgUnitInToggleList) {
                                    return section;
                                }
                                if (toggle.disabled) {
                                    return {
                                        ...section,
                                        dataElements: dataElements.map(de => ({ ...de, disabled: true })),
                                    };
                                }
                                return { ...section, hidden: true };
                            }
                            default:
                                console.error(`Unknown orgUnit toggle condition`);
                                return section;
                        }
                    } else if (toggle.dataElements.length > 0) {
                        const ouToggledDataElements = this.applyOrgUnitToggleFilter(
                            dataElements,
                            toggle,
                            isOrgUnitInToggleList
                        );

                        return {
                            ...section,
                            dataElements: ouToggledDataElements,
                        };
                    }
                }

                return section;
            })
            .compact()
            .value();
    }

    private applyOrgUnitToggleFilter(
        dataElements: DataElement[],
        toggle: OrgUnitToggle,
        isOrgUnitInToggleList: boolean
    ): DataElement[] {
        const { condition, dataElements: toggleDataElements, disabled } = toggle;

        return _(dataElements)
            .map(dataElement => {
                const dataElementExistsInToggle = toggleDataElements.includes(dataElement.code);

                if (!dataElementExistsInToggle) {
                    return dataElement;
                }

                switch (condition) {
                    case "hide": {
                        if (isOrgUnitInToggleList) {
                            if (disabled) {
                                return { ...dataElement, disabled: true };
                            }
                            return undefined;
                        }
                        return dataElement;
                    }
                    case "show": {
                        if (isOrgUnitInToggleList) {
                            return dataElement;
                        }
                        if (disabled) {
                            return { ...dataElement, disabled: true };
                        }
                        return undefined;
                    }
                }
            })
            .compact()
            .value();
    }
}
