import _ from "lodash";
import { Section, SectionWithSubnationals, Texts } from "../../../domain/common/entities/DataForm";
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
    level: number;
    deName?: string;
    cocName?: string;
    rowIndex: string;
}

interface Row {
    name: string;
    items: Array<{
        column: Column;
        columnDataElements?: DataElement[];
        columnTotal?: DataElement;
        dataElement: DataElement | undefined;
        manualyDisabled: boolean;
        total: DataElement | undefined;
    }>;
}

type ParentColumn = {
    name: string;
};

const separator = " - ";

function extractNumber(value: Maybe<string>): string {
    if (!value) return "";
    const regex = /^\d+(\.\d+)?/;
    const result = value.match(regex);
    return result && result[0] ? result[0] : "";
}

export class GridWithSubNationalViewModel {
    static get(section: SectionWithSubnationals): Grid {
        const dataElements = getDataElementsWithIndexProccessing(section);
        const subsections = _(dataElements)
            .flatMap(dataElement => {
                const cocNames = dataElement.categoryCombos.categoryOptionCombos.map(coc => coc.name);
                return cocNames.flatMap(coc => ({
                    ...dataElement,
                    cocId: dataElement.categoryCombos.categoryOptionCombos.find(c => c.name === coc)?.id || "cocId",
                    name: `${coc} - ${_(dataElement.name).split(separator).last()}`,
                    fullName: dataElement.name,
                    cocName: coc,
                }));
            })
            .groupBy(dataElement => dataElement.cocName)
            .toPairs()
            .map(([groupName, dataElementsForGroup]): SubSectionGrid | undefined => {
                return {
                    name: groupName,
                    dataElements: dataElementsForGroup.map(dataElement => ({
                        ...dataElement,
                        name: dataElement.fullName,
                    })),
                };
            })
            .compact()
            .value();

        const columns: Column[] = _(subsections)
            .flatMap(subsection => subsection.dataElements)
            .uniqBy(de => de.name)
            .map(de => {
                const splitNameBySeparator = _(de.name).split(separator).value();
                const deName = splitNameBySeparator.length > 1 ? _(splitNameBySeparator).first() : "";
                const parts = deName?.split(".") || [];
                return {
                    name: de.name,
                    deName,
                    level: parts.length,
                    cocName: _(splitNameBySeparator).last() || "",
                    rowIndex: _(parts).first() || "",
                };
            })
            .value();

        const parentColumns = _(columns)
            .map(c => ({ name: extractNumber(c.deName) }))
            .value();

        const dataElementsByTotal = _(section.calculateTotals)
            .groupBy(item => item?.totalDeCode)
            .map((group, totalColumn) => ({
                totalColumn,
                dataElements: group.map(item => _.findKey(section.calculateTotals, obj => obj === item)),
            }))
            .value();

        const rows = _.orderBy(
            section.subNationals.map(subNational => {
                const items = columns.map(column => {
                    const dataElement = section.dataElements.find(de => de.name === column.name);

                    const deCalculateTotal =
                        section.calculateTotals && dataElement?.code
                            ? section.calculateTotals[dataElement.code]
                            : undefined;

                    const parentTotal = deCalculateTotal
                        ? dataElements.find(de => de.code === deCalculateTotal?.totalDeCode)
                        : undefined;

                    const dataElementsInTotalColumn = dataElementsByTotal.find(
                        x => x.totalColumn === parentTotal?.code
                    );
                    const columnDataElements = dataElements.filter(de =>
                        dataElementsInTotalColumn?.dataElements.includes(de.code)
                    );

                    return {
                        column,
                        columnTotal: parentTotal,
                        total: _.merge({}, parentTotal, { name: "" }),
                        manualyDisabled: deCalculateTotal?.disabled ?? false,
                        columnDataElements: columnDataElements,
                        dataElement: _.merge({}, dataElement, { orgUnit: subNational.id }),
                    };
                });

                return {
                    name: subNational.name,
                    items,
                };
            }),
            [section.sortRowsBy ? section.sortRowsBy : ""]
        );

        const useIndexes =
            _(rows).every(row => Boolean(row.name.match(/\(\d+\)$/))) &&
            _(rows)
                .groupBy(row => row.name.replace(/\s*\(\d+\)$/, ""))
                .size() === 1;

        return {
            id: section.id,
            name: section.name,
            columns: columns,
            rows,
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
