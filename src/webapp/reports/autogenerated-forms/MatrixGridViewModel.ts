import _ from "lodash";
import { Section, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { Maybe } from "../../../utils/ts-utils";

export interface MatrixGrid {
    id: string;
    name: string;
    columns: Column[];
    rows: DataElement[][];
    styles: Section["styles"];
    toggle: Section["toggle"];
    toggleMultiple: Section["toggleMultiple"];
    texts: Texts;
}

interface Column {
    columnHeader: string;
    columnDescription: Maybe<string>;
    rows: DataElement[];
}

export class MatrixGridViewModel {
    static get(section: Section): MatrixGrid {
        const columns: Column[] = _(section.dataElements)
            .groupBy(dataElement => {
                const columnHeader = _(dataElement.name).split(" - ").first();
                return columnHeader;
            })
            .map((group, columnHeader) => ({
                columnHeader,
                columnDescription: group[0].name.split(" - ")[1],
                rows: group.map(item => ({
                    ...item,
                    name: _(item.name).split(" - ").last() ?? "",
                })),
            }))
            .value();

        const rows: DataElement[][] = _(columns)
            .flatMap(column =>
                column.rows.map((row, index) => ({
                    index,
                    row,
                }))
            )
            .groupBy("index")
            .values()
            .map(group => group.map(({ row }) => row))
            .value();

        return {
            id: section.id,
            name: section.name,
            columns: columns,
            rows: rows,
            styles: section.styles,
            toggle: section.toggle,
            toggleMultiple: section.toggleMultiple,
            texts: section.texts,
        };
    }
}
