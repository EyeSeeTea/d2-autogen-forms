import { Id } from "@eyeseetea/d2-api";
import { Period } from "../entities/DataValue";
import { DataFormRepository } from "../repositories/DataFormRepository";
import { OrgUnitsRepository } from "../repositories/OrgUnitsRepository";
import { DataForm, Section } from "../entities/DataForm";
import _ from "lodash";
import { OrgUnit } from "../entities/OrgUnit";
import { DataElement } from "../entities/DataElement";
import { OrgUnitToggle } from "../../../data/common/Dhis2DataStoreDataForm";

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
                    const keepVisibleWhenNotMatched = Boolean(toggle.visible) && !toggle.hidden;
                    const shouldShow =
                        toggle.condition === "show" ? isOrgUnitInToggleList : !isOrgUnitInToggleList;

                    if (toggle.dataElements.length === 0) {
                        if (shouldShow || keepVisibleWhenNotMatched) {
                            return section;
                        }
                        return { ...section, hidden: true };
                    } else if (toggle.dataElements.length > 0) {
                        const ouToggledDataElements = this.applyOrgUnitToggleFilter(
                            dataElements,
                            toggle,
                            isOrgUnitInToggleList,
                            keepVisibleWhenNotMatched
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
        isOrgUnitInToggleList: boolean,
        keepVisibleWhenNotMatched: boolean
    ): DataElement[] {
        const { condition, dataElements: toggleDataElements } = toggle;
        const shouldShow = condition === "show" ? isOrgUnitInToggleList : !isOrgUnitInToggleList;

        return _(dataElements)
            .map(dataElement => {
                const dataElementExistsInToggle = toggleDataElements.includes(dataElement.code);

                if (!dataElementExistsInToggle) {
                    return dataElement;
                }

                if (shouldShow || keepVisibleWhenNotMatched) {
                    return dataElement;
                }
                return undefined;
            })
            .compact()
            .value();
    }
}
