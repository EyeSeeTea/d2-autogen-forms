import _ from "lodash";
import { Section, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { titleVariant } from "../../../domain/common/entities/TitleVariant";
import { Maybe } from "../../../utils/ts-utils";
import { getFormulaByColumnName, Summary, TotalItem } from "./GridWithCatOptionCombosViewModel";
import { DataFormInfo } from "./AutogeneratedForm";
import { getDescription } from "../../../utils/viewTypes";

export interface Grid {
    id: string;
    name: string;
    columns: Column[];
    rows: Row[];
    toggle: Section["toggle"];
    toggleMultiple: Section["toggleMultiple"];
    useIndexes: boolean;
    texts: Texts;
    titleVariant: titleVariant;
    summary: Maybe<Summary>;
}

interface SubSectionGrid {
    name: string;
    dataElements: DataElement[];
}

interface Column {
    name: string;
    description?: string;
}

interface Row {
    name: string;
    htmlText: string;
    items: Array<{ column: Column; dataElement: DataElement | undefined; disableComments: boolean }>;
}

const separator = " - ";

export class GridViewModel {
    static get(section: Section, dataFormInfo: DataFormInfo): Grid {
        const dataElements = getDataElementsWithIndexProccessing(section);

        const subsections = _(dataElements)
            .groupBy(dataElement => getSubsectionName(dataElement))
            .toPairs()
            .map(
                ([groupName, dataElementsForGroup]): SubSectionGrid => ({
                    name: groupName,
                    dataElements: dataElementsForGroup.map(dataElement => ({
                        ...dataElement,
                        name: _(dataElement.name).split(separator).last() || "-",
                    })),
                })
            )
            .value();

        const columns: Column[] = _(subsections)
            .flatMap(subsection => subsection.dataElements)
            .uniqBy(de => de.name)
            .map(({ name }) => {
                const columnDescription = getDescription(section.columnsDescriptions, dataFormInfo, name);

                return { name: name, description: columnDescription };
            })
            .value();

        const rows = subsections.map(subsection => {
            const items = columns.map(column => {
                const dataElement = subsection.dataElements.find(de => de.name === column.name);
                return {
                    column,
                    dataElement,
                    disableComments: section.disableComments || dataElement?.disabledComments || false,
                };
            });

            const itemsWithHtmlText = _(items)
                .map(item => item.dataElement?.htmlText)
                .compact()
                .value();

            const firstItemWithHtmlText = _(itemsWithHtmlText).first() || "";

            return { name: subsection.name, htmlText: firstItemWithHtmlText, items: items };
        });

        const useIndexes =
            _(rows).every(row => Boolean(row.name.match(/\(\d+\)$/))) &&
            _(rows)
                .groupBy(row => row.name.replace(/\s*\(\d+\)$/, ""))
                .size() === 1;

        const totals = _(columns)
            .map(column => {
                const allDataElements = subsections.flatMap(subSection => subSection.dataElements);
                const selectedDataElements = allDataElements.filter(dataElement =>
                    section.totals?.dataElementsCodes.includes(dataElement.code)
                );

                const columnWithDataElements = _(selectedDataElements)
                    .map((dataElement): Maybe<TotalItem> => {
                        if (dataElement.type !== "NUMBER") return undefined;
                        const categoryOptionCombo = dataElement.categoryOptionCombos[0];
                        if (!categoryOptionCombo) {
                            console.warn(
                                `Cannot found categoryOptionCombo in column ${column.name} for dataElement ${dataElement.code}`
                            );
                            return undefined;
                        }

                        return { dataElement, categoryOptionCombo };
                    })
                    .compact()
                    .value();

                return {
                    columnName: column.name,
                    formula: getFormulaByColumnName(section, column.name) || section.totals?.formula || "",
                    items: columnWithDataElements,
                };
            })
            .value();

        return {
            id: section.id,
            name: section.name,
            columns: columns,
            rows: rows,
            toggle: section.toggle,
            toggleMultiple: section.toggleMultiple,
            texts: section.texts,
            useIndexes: useIndexes,
            titleVariant: section.titleVariant,
            summary: section.totals
                ? {
                      cellName: section.texts?.totals || "",
                      cells: totals,
                  }
                : undefined,
        };
    }
}

/** Move the data element index to the row name, so indexed data elements are automatically grouped 

    Input:
        MAL - Compound name (1)
        MAL - Compound name (2)
        MAL - Compound symbol (1)
        MAL - Compound symbol (2)

    Output:
        MAL (1) - Compound name
        MAL (2) - Compound name
        MAL (1) - Compound symbol
        MAL (2) - Compound symbol
*/

function getDataElementsWithIndexProccessing(section: Section) {
    return section.dataElements.map((dataElement): typeof dataElement => {
        // "MAL - Compound name (1)" -> "MAL (1) - Compound name"
        const index = dataElement.name.match(/\((\d+)\)$/)?.[1];

        if (!index) {
            return dataElement;
        } else {
            const parts = dataElement.name.split(separator);
            const initial = _.initial(parts).join(separator);
            const last = _.last(parts);
            if (!last) return dataElement;
            const lastWithoutIndex = last.replace(/\s*\(\d+\)$/, "");
            const newName = `${initial} (${index}) - ${lastWithoutIndex}`;
            return { ...dataElement, name: newName };
        }
    });
}

function getSubsectionName(dataElement: DataElement): string {
    // Remove index from enumerated data elements (example: `Chemical name (1)` -> `Chemical name`)
    // so they are grouped with no need to edit each name in the metadata.
    return _(dataElement.name).split(separator).initial().join(separator);
}
