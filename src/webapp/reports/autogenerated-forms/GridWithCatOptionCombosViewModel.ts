import _ from "lodash";
import { Section, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";

export interface Grid {
    id: string;
    name: string;
    columns: Column[];
    rows: Row[];
    toggle: Section["toggle"];
    texts: Texts;
}

interface SubSectionGrid {
    name: string;
    dataElements: DataElement[];
}

interface Column {
    name: string;
    items: Array<{ row: Row; dataElement: DataElement | undefined }>;
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
                const cocNames = dataElement.categoryOptionCombos.map(coc => coc.name);
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
                const items = rows.map(row => {
                    const dataElement = subsection.dataElements.find(de => row.rows.map(r => r.name).includes(de.name));
                    return { row, dataElement };
                });

                return { name: subsection.name, items };
            }),
            [section.sortRowsBy ? section.sortRowsBy : ""]
        );

        return {
            id: section.id,
            name: section.name,
            columns: columns,
            rows: rows,
            toggle: section.toggle,
            texts: section.texts,
        };
    }
}
