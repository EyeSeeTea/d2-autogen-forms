import _ from "lodash";
import { Section, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { CategoryOptionCombo } from "../../../domain/common/entities/CategoryOptionCombo";
import { Maybe } from "../../../utils/ts-utils";

export interface Grid {
    id: string;
    name: string;
    columns: Column[];
    rows: Row[];
    toggle: Section["toggle"];
    texts: Texts;
    summary: Maybe<Summary>;
}

export type Summary = { cells: CellTotal[]; formula: string; cellName: string };
export type CellTotal = { columnName: string; items: TotalItem[] };
type TotalItem = { dataElement: DataElement; categoryOptionCombo: CategoryOptionCombo };

interface SubSectionGrid {
    name: string;
    dataElements: DataElement[];
}

interface Column {
    name: string;
    dataElements: DataElement[];
}

interface Row {
    groupName: string;
    rows: {
        deName: string;
        name: string;
    }[];
}

const separator = " - ";

export class GridWithCatOptionCombosViewModel {
    static get(section: Section): Grid {
        const subsections = _(section.dataElements)
            .flatMap(dataElement => {
                const categoryOptionCombos = dataElement.categoryOptionCombos;

                return categoryOptionCombos.map(coc => ({
                    ...dataElement,
                    cocId: dataElement.categoryOptionCombos.find(c => c.name === coc.name)?.id,
                    name: `${coc.name} - ${_(dataElement.name).split(separator).last()}`,
                    fullName: dataElement.name,
                    cocName: coc.name,
                }));
            })
            .filter(dataElement => dataElement.cocId !== undefined)
            .groupBy(dataElement => dataElement.cocName)
            .toPairs()
            .map(([groupName, dataElementsForGroup]): SubSectionGrid => {
                return {
                    name: groupName,
                    dataElements: dataElementsForGroup.map(dataElement => ({
                        ...dataElement,
                        name: dataElement.fullName,
                    })),
                };
            })
            .value();

        const rows = _(subsections)
            .flatMap(subsection => subsection.dataElements)
            .uniqBy(de => de.name)
            .groupBy(de => _(de.name.split(separator)).initial().join(" - "))
            .map((group, groupName) => ({
                groupName,
                rows: group.map(de => {
                    return { deName: _.last(de.name.split(separator)) ?? "", name: de.name };
                }),
            }))
            .value();

        const columns: Column[] = _.orderBy(
            subsections.map(subsection => {
                const dataElements = rows.flatMap(row => {
                    return subsection.dataElements.filter(de => row.rows.map(r => r.name).includes(de.name));
                });

                return { name: subsection.name, dataElements };
            }),
            [section.sortRowsBy ? section.sortRowsBy : ""]
        );

        const totals = _(columns)
            .map(column => {
                const selectedDataElements = column.dataElements.filter(dataElement =>
                    section.totals?.dataElementsCodes.includes(dataElement.code)
                );

                const columnWithDataElements = _(selectedDataElements)
                    .map((dataElement): Maybe<TotalItem> => {
                        if (dataElement.type !== "NUMBER") return undefined;
                        const categoryOptionCombo = dataElement.categoryOptionCombos.find(
                            coc => coc.name === column.name
                        );
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

                return { columnName: column.name, items: columnWithDataElements };
            })
            .value();

        return {
            id: section.id,
            name: section.name,
            columns: columns,
            rows: rows,
            toggle: section.toggle,
            texts: section.texts,
            summary: section.totals
                ? {
                      cellName: section.totals.texts?.name || "",
                      formula: section.totals.formula,
                      cells: totals,
                  }
                : undefined,
        };
    }
}
