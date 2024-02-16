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
                const [columnHeader, _columnDescription] = dataElement.name.split(" - ");
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

        const rows = _(columns).reduce((acc: DataElement[][], column: Column) => {
            column.rows.forEach((row, index) => {
                if (!acc[index]) {
                    acc[index] = [];
                }
                acc[index]?.push(row);
            });

            return acc;
        }, []);

        return {
            id: section.id,
            name: section.name,
            columns: columns,
            rows: rows,
            styles: section.styles,
            toggle: section.toggle,
            texts: section.texts,
        };
    }
}
