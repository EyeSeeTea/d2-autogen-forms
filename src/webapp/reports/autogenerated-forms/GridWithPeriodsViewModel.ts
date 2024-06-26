import _ from "lodash";
import { Section, SectionWithPeriods, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { Id } from "../../../domain/common/entities/Base";
import {
    CategoryOptionCombo,
    DEFAULT_CATEGORY_OPTION_COMBO_CODE,
} from "../../../domain/common/entities/CategoryOptionCombo";
import { Maybe } from "../../../utils/ts-utils";
import { getDescription } from "../../../utils/viewTypes";
import { DataFormInfo } from "./AutogeneratedForm";
import { getFormulaByColumnName, Summary, TotalItem } from "./GridWithCatOptionCombosViewModel";
import { getIndicatorRelatedToDataElement, Indicator } from "../../../domain/common/entities/Indicator";

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
    indicators: Indicator[];
}

interface DataElementRow {
    type: "dataElement" | "dataElementFile";
    dataElement: DataElement;
    indicator: Maybe<Indicator>;
}

interface DataElementGroup {
    type: "group";
    groupDescription: Maybe<string>;
    name: string;
    rows: DataElementRow[];
}

export interface DataElementSubGroupRow {
    indicator: Maybe<Indicator>;
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
    static get(section: SectionWithPeriods, dataFormInfo: DataFormInfo): GridWithPeriodsI {
        const rows = _(section.dataElements)
            .groupBy(dataElement => _(dataElement.name).split(separator).first())
            .toPairs()
            .map(([groupName, dataElementsForGroup]): Row => {
                if (dataElementsForGroup.length === 1) {
                    const code = dataElementsForGroup[0].code;
                    const indicator = getIndicatorRelatedToDataElement(section.indicators, code);
                    return {
                        type: dataElementsForGroup[0].type === "FILE" ? "dataElementFile" : "dataElement",
                        dataElement: dataElementsForGroup[0],
                        indicator: indicator,
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

                            const indicator = getIndicatorRelatedToDataElement(section.indicators, dataElement.code);

                            return {
                                groupName: index === 0 ? groupName : undefined,
                                subGroup: subGroup ? subGroup.subGroup : undefined,
                                colSpan: hasSubGroup ? "0" : "2",
                                dataElement: {
                                    ...dataElement,
                                    name: _(dataElement.name).split(separator).last() || "-",
                                },
                                indicator: indicator,
                                dataElementsPerSubGroup: subGroup
                                    ? subGroups.filter(sg => sg.subGroup === subGroup.subGroup).length
                                    : 0,
                            };
                        });

                        return { type: "subGroup", rows: rows };
                    } else {
                        const firstDeInGroup = _(dataElementsForGroup).first()?.code || "";
                        const groupDescription = getDescription(
                            section.groupDescriptions,
                            dataFormInfo,
                            firstDeInGroup
                        );

                        return {
                            type: "group",
                            name: groupName,
                            groupDescription: groupDescription,
                            rows: dataElementsForGroup.map(dataElement => {
                                const indicator = getIndicatorRelatedToDataElement(
                                    section.indicators,
                                    dataElement.code
                                );
                                return {
                                    type: "dataElement",
                                    dataElement: {
                                        ...dataElement,
                                        name: _(dataElement.name).split(separator).last() || "-",
                                    },
                                    indicator: indicator,
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

        const indicatorsRelatedToDataElements = _(rows)
            .flatMap(row => {
                if (row.type === "dataElement") {
                    return row.indicator?.id || [];
                } else if (row.type === "group") {
                    return row.rows.map(row => row.indicator?.id);
                } else if (row.type === "subGroup") {
                    return row.rows.map(row => row.indicator?.id);
                }
            })
            .compact()
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
            indicators:
                indicatorsRelatedToDataElements.length > 0
                    ? section.indicators.filter(indicator => !indicatorsRelatedToDataElements.includes(indicator.id))
                    : section.indicators,
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
