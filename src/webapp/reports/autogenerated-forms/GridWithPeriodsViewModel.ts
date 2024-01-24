import _ from "lodash";
import { Section, SectionWithPeriods, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { Id } from "../../../domain/common/entities/Base";
import {
    CategoryOptionCombo,
    DEFAULT_CATEGORY_OPTION_COMBO_CODE,
} from "../../../domain/common/entities/CategoryOptionCombo";

export interface GridWithPeriodsI {
    id: string;
    name: string;
    rows: Row[];
    periods: string[];
    toggle: Section["toggle"];
    texts: Texts;
    tabs: PeriodTab[];
}

interface DataElementRow {
    type: "dataElement" | "dataElementFile";
    dataElement: DataElement;
}

type Row = { type: "group"; name: string; rows: DataElementRow[] } | DataElementRow;

const separator = " - ";

export class GridWithPeriodsViewModel {
    static get(section: SectionWithPeriods): GridWithPeriodsI {
        const rows = _(section.dataElements)
            .groupBy(dataElement => _(dataElement.name).split(separator).initial().join(separator))
            .toPairs()
            .map(([groupName, dataElementsForGroup]): Row => {
                if (dataElementsForGroup.length === 1) {
                    return {
                        type: dataElementsForGroup[0].type === "FILE" ? "dataElementFile" : "dataElement",
                        dataElement: dataElementsForGroup[0],
                    };
                } else {
                    return {
                        type: "group",
                        name: groupName,
                        rows: dataElementsForGroup.map(de => ({
                            type: "dataElement",
                            dataElement: {
                                ...de,
                                name: _(de.name).split(separator).last() || "-",
                            },
                        })),
                    };
                }
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

type PeriodTab = { id: Id | undefined; name: string };
