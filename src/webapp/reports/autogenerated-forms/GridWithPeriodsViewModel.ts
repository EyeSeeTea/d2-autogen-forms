import _ from "lodash";
import { Section, SectionWithPeriods, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { Id } from "../../../domain/common/entities/Base";
import {
    CategoryOptionCombo,
    DEFAULT_CATEGORY_OPTION_COMBO_CODE,
} from "../../../domain/common/entities/CategoryOptionCombo";
import { Maybe } from "../../../utils/ts-utils";
import { getFormulaByColumnName, Summary, TotalItem } from "./GridWithCatOptionCombosViewModel";

export interface GridWithPeriodsI {
    id: string;
    name: string;
    rows: Row[];
    periods: string[];
    toggle: Section["toggle"];
    toggleMultiple: Section["toggleMultiple"];
    texts: Texts;
    tabs: PeriodTab[];
    summary: Maybe<Summary>;
}

interface DataElementRow {
    type: "dataElement" | "dataElementFile";
    dataElement: DataElement;
}

interface DataElementGroup {
    type: "group";
    name: string;
    rows: DataElementRow[];
}

export interface DataElementSubGroupRow {
    groupName: Maybe<string>;
    subGroup: Maybe<string>;
    colSpan: string;
    dataElement: DataElement;
    dataElementsPerSubGroup: number;
}

interface DataElementSubGroup {
    type: "subGroup";
    rows: DataElementSubGroupRow[];
}

type Row = DataElementGroup | DataElementSubGroup | DataElementRow;

const separator = /:| - /;

export class GridWithPeriodsViewModel {
    static get(section: SectionWithPeriods): GridWithPeriodsI {
        const rows = _(section.dataElements)
            .groupBy(dataElement => _(dataElement.name).split(separator).first())
            .toPairs()
            .map(([groupName, dataElementsForGroup]): Row => {
                if (dataElementsForGroup.length === 1) {
                    return {
                        type: dataElementsForGroup[0].type === "FILE" ? "dataElementFile" : "dataElement",
                        dataElement: dataElementsForGroup[0],
                    };
                } else {
                    const hasSubGroup = _(dataElementsForGroup).some(dataElement => isRowSubGroup(dataElement));

                    if (hasSubGroup) {
                        const subGroups = _(dataElementsForGroup)
                            .map((dataElement, index) => {
                                const hasSubGroup = isRowSubGroup(dataElement);
                                if (!hasSubGroup) return undefined;

                                return {
                                    position: index,
                                    subGroup: _(dataElement.name).split(separator).nth(1),
                                };
                            })
                            .compact()
                            .value();

                        const uniqueSubGroups = _(subGroups)
                            .uniqBy(subGroup => subGroup.subGroup)
                            .value();

                        const rows = dataElementsForGroup.map((dataElement, index) => {
                            const hasSubGroup = isRowSubGroup(dataElement);
                            const subGroup = uniqueSubGroups.find(subGroup => subGroup.position === index);

                            return {
                                groupName: index === 0 ? groupName : undefined,
                                subGroup: subGroup ? subGroup.subGroup : undefined,
                                colSpan: hasSubGroup ? "0" : "2",
                                dataElement: {
                                    ...dataElement,
                                    name: _(dataElement.name).split(separator).last() || "-",
                                },
                                dataElementsPerSubGroup: subGroup
                                    ? subGroups.filter(sg => sg.subGroup === subGroup.subGroup).length
                                    : 0,
                            };
                        });

                        return { type: "subGroup", rows: rows };
                    } else {
                        return {
                            type: "group",
                            name: groupName,
                            rows: dataElementsForGroup.map(dataElement => {
                                return {
                                    type: "dataElement",
                                    dataElement: {
                                        ...dataElement,
                                        name: _(dataElement.name).split(separator).last() || "-",
                                    },
                                };
                            }),
                        };
                    }
                }
            })
            .value();

        const totals = _(section.periods)
            .map(column => {
                const allDataElements = section.dataElements;
                const selectedDataElements = allDataElements.filter(dataElement =>
                    section.totals?.dataElementsCodes.includes(dataElement.code)
                );

                const columnWithDataElements = _(selectedDataElements)
                    .map((dataElement): Maybe<TotalItem> => {
                        if (dataElement.type !== "NUMBER") return undefined;
                        const categoryOptionCombo = dataElement.categoryOptionCombos[0];
                        if (!categoryOptionCombo) {
                            console.warn(
                                `Cannot found categoryOptionCombo in column ${column} for dataElement ${dataElement.code}`
                            );
                            return undefined;
                        }

                        return { dataElement, categoryOptionCombo };
                    })
                    .compact()
                    .value();

                return {
                    columnName: column,
                    formula: getFormulaByColumnName(section, "") || section.totals?.formula || "",
                    items: columnWithDataElements,
                };
            })
            .value();

        return {
            id: section.id,
            name: section.name,
            rows: rows,
            periods: section.periods,
            toggle: section.toggle,
            texts: section.texts,
            tabs: this.buildTabs(section.dataElements),
            toggleMultiple: section.toggleMultiple,
            summary: section.totals
                ? {
                      cellName: section.texts?.totals || "",
                      cells: totals,
                  }
                : undefined,
        };
    }

    private static buildTabs(dataElements: DataElement[]): PeriodTab[] {
        const uniqueCategoryOptions = _(dataElements)
            .flatMap(dataElement => dataElement.categoryCombos.categoryOptionCombos)
            .uniqBy(categoryOptionCombo => categoryOptionCombo.id)
            .value();

        if (this.hasOnlyDefaultCategoryOption(uniqueCategoryOptions)) return [];

        return _(uniqueCategoryOptions)
            .map(categoryOption => {
                return { id: categoryOption.id, name: categoryOption.name };
            })
            .uniqBy(periodTab => periodTab.id)
            .value();
    }

    private static hasOnlyDefaultCategoryOption(allCategoryOptions: CategoryOptionCombo[]): boolean {
        return allCategoryOptions.filter(c => c.name === DEFAULT_CATEGORY_OPTION_COMBO_CODE).length === 1;
    }
}

function isRowSubGroup(dataElement: DataElement): boolean {
    return dataElement.name.split(separator).length === 3;
}

type PeriodTab = { id: Id | undefined; name: string };
