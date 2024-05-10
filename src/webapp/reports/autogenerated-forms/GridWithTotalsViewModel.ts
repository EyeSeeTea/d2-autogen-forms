import _ from "lodash";
import { Section, SectionWithTotals, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { Maybe } from "../../../utils/ts-utils";

export interface Grid {
    id: string;
    name: string;
    columns: Column[];
    rows: Row[];
    toggle: Section["toggle"];
    toggleMultiple: Section["toggleMultiple"];
    useIndexes: boolean;
    texts: Texts;
    parentColumns: ParentColumn[];
}

interface SubSectionGrid {
    name: string;
    dataElements: DataElement[];
}

interface Column {
    name: string;
    deName?: string;
    cocName?: string;
    isSourceType: boolean;
}

export interface Row {
    name: string;
    includePadding: number;
    total?: DataElement;
    rowDisabled?: boolean;
    items: Array<{
        column: Column;
        columnTotal?: DataElement;
        columnDataElements?: DataElement[];
        dataElement: DataElement | undefined;
        disabled: boolean;
    }>;
}

type ParentColumn = {
    name: string;
    colSpan: number;
};

const separator = " - ";

export class GridWithTotalsViewModel {
    static get(
        section: SectionWithTotals,
        sectionDataElements: DataElement[],
        dataElementsConfig: Record<string, { widget: Maybe<"dropdown" | "radio" | "sourceType"> }>
    ): Grid {
        const dataElements = getDataElementsWithIndexProccessing(section);

        const subsections = _(dataElements)
            .groupBy(dataElement => getSubsectionName(dataElement))
            .toPairs()
            .map(([groupName, dataElementsForGroup]): SubSectionGrid => {
                return getSubsections(groupName, dataElementsForGroup);
            })
            .value();

        const columns: Column[] = _(subsections)
            .flatMap(subsection => subsection.dataElements)
            .uniqBy(de => de.name)
            .map(de => {
                const categoryOptionCombos = de.categoryCombos.categoryOptionCombos;
                const config = dataElementsConfig[de.id];
                if (categoryOptionCombos.length !== 1 && categoryOptionCombos[0]?.name !== "default") {
                    return {
                        name: de.name,
                        deName: _(de.name).split(separator).head(),
                        cocName: _(de.name).split(separator).last(),
                        isSourceType: false,
                    };
                } else {
                    return {
                        name: de.name,
                        isSourceType: config?.widget === "sourceType",
                    };
                }
            })
            .value();

        const parentColumns = _(columns)
            .map(c => (c.deName && c.cocName ? c.deName : undefined))
            .compact()
            .groupBy()
            .map((values, name) => ({ name, colSpan: values.length }))
            .value();

        const dataElementsByTotal = _(section.calculateTotals)
            .groupBy(item => item?.totalDeCode)
            .map((group, totalColumn) => ({
                totalColumn,
                dataElements: group.map(item => _.findKey(section.calculateTotals, obj => obj === item)),
            }))
            .value();

        const rows = subsections.map(subsection => {
            const total = sectionDataElements.find(de => de.name.replace(" - Total", "") === subsection.name);
            const index = subsection.name.split(separator)[0];
            const totalRowIndex = index?.split(".")[0];

            const indexedDEs = dataElements.filter(de => {
                return totalRowIndex ? de.name.startsWith(`${totalRowIndex}.`) : [];
            });

            const hasTotals = index?.split(".").length === 2 && !_.isEmpty(totalRowIndex);
            const items = columns.map(column => {
                const dataElement = subsection.dataElements.find(de => de.name === column.name);
                let columnTotal;
                let columnDataElements;
                const deCalculateTotal =
                    section.calculateTotals && dataElement?.code
                        ? section.calculateTotals[dataElement.code]
                        : undefined;
                if (hasTotals) {
                    const parentTotal = deCalculateTotal
                        ? dataElements.find(de => de.code === deCalculateTotal?.totalDeCode)
                        : undefined;

                    columnTotal =
                        parentTotal ||
                        dataElements.find(de => {
                            return (
                                de.name.startsWith(`${totalRowIndex}${separator}`) &&
                                de.name.endsWith(`${dataElement?.name.split(separator)[0]}`)
                            );
                        });

                    const dataElementsInTotalColumn = dataElementsByTotal.find(
                        x => x.totalColumn === parentTotal?.code
                    );

                    columnDataElements = dataElementsInTotalColumn
                        ? dataElements.filter(de => dataElementsInTotalColumn.dataElements.includes(de.code))
                        : indexedDEs.filter(de => {
                              return (
                                  de.name.match(/^\d+\.\d+ - /g) &&
                                  de.name.endsWith(`${dataElement?.name.split(separator)[0]}`)
                              );
                          });
                }

                return {
                    column,
                    columnTotal: deCalculateTotal?.totalDeCode ? columnTotal : undefined,
                    columnDataElements,
                    dataElement,
                    disabled: deCalculateTotal?.disabled ?? false,
                };
            });

            // Since we cannot add spaces or tabs in a form name
            // we're adding a little padding for each row number
            const includePadding = index ? index.split(".").length - 1 : 0;
            return {
                name: subsection.name,
                includePadding: includePadding,
                total: total,
                rowDisabled: false,
                items: items,
            };
        });

        const useIndexes =
            _(rows).every(row => Boolean(row.name.match(/\(\d+\)$/))) &&
            _(rows)
                .groupBy(row => row.name.replace(/\s*\(\d+\)$/, ""))
                .size() === 1;

        return {
            id: section.id,
            name: section.name,
            columns: columns,
            rows: rows,
            toggle: section.toggle,
            texts: section.texts,
            useIndexes: useIndexes,
            parentColumns,
            toggleMultiple: section.toggleMultiple,
        };
    }
}

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

function getSubsections(groupName: string, groupDataElements: DataElement[]): SubSectionGrid {
    return {
        name: groupName,
        dataElements: groupDataElements.flatMap(dataElement => {
            const cocNames = dataElement.categoryCombos.categoryOptionCombos.map(coc => coc.name);

            if (cocNames.length === 1 && cocNames[0] === "default") {
                return [
                    {
                        ...dataElement,
                        name: _(dataElement.name).split(separator).last() || "-",
                    },
                ];
            } else {
                return cocNames.map(coc => ({
                    ...dataElement,
                    cocId: dataElement.categoryCombos.categoryOptionCombos.find(c => c.name === coc)?.id || "cocId",
                    name: `${_(dataElement.name).split(separator).last()} - ${coc}` || "-",
                }));
            }
        }),
    };
}
