import _ from "lodash";
import { Section } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { Maybe } from "../../../utils/ts-utils";
import { splitDataElementName } from "./utils/dataElementNameSeparator";

export interface MatrixGrid {
    id: string;
    name: string;
    columns: Column[];
    rows: DataElement[][];
    styles: Section["styles"];
    toggle: Section["toggle"];
    toggleMultiple: Section["toggleMultiple"];
    texts: Section["texts"];
    hidden: boolean;
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
                const columnHeader = splitDataElementName(dataElement.name)[0];
                return columnHeader;
            })
            .map((group, columnHeader) => ({
                columnHeader,
                columnDescription: splitDataElementName(group[0].name)[1],
                rows: group.map(item => ({
                    ...item,
                    name: _.last(splitDataElementName(item.name)) ?? "",
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
            hidden: section.hidden || false,
        };
    }
}
