import _ from "lodash";
import { Section, SectionWithSubnationals, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";

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
            .map(c => ({ name: c.deName || "" }))
            .value();

        const columnsByRowIndex = _(columns)
            .filter(column => column.level === 2)
            .groupBy(c => c.rowIndex)
            .value();

        const rows = _.orderBy(
            section.subNationals.map(subNational => {
                let columnTotal: DataElement | undefined;
                const items = columns.map(column => {
                    const isLevelOne = column.level === 1;
                    const isLevelTwo = column.level === 2;
                    let dataElementsForColumns = undefined;
                    const dataElement = section.dataElements.find(de => de.name === column.name);
                    if (isLevelOne) {
                        columnTotal = dataElement;
                    }

                    const columnsForTotal = columnsByRowIndex[column.rowIndex]?.map(column => column.name) || [];
                    dataElementsForColumns = section.dataElements.filter(de => columnsForTotal.includes(de.name));

                    return {
                        column,
                        columnTotal: isLevelTwo ? columnTotal : undefined,
                        total: _.merge({}, columnTotal, { name: "" }),
                        manualyDisabled: isLevelOne && dataElementsForColumns.length > 0,
                        columnDataElements: isLevelTwo ? dataElementsForColumns : undefined,
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
