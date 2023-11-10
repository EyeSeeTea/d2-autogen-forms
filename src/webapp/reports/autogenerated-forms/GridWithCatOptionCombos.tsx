import React from "react";
import { SectionSimple } from "../../../domain/common/entities/DataForm";
import { DataFormInfo } from "./AutogeneratedForm";
import { makeStyles } from "@material-ui/core";
import { GridWithCatOptionCombosViewModel } from "./GridWithCatOptionCombosViewModel";
import DataTableSection from "./DataTableSection";
import {
    DataTable,
    DataTableCell,
    DataTableColumnHeader,
    DataTableRow,
    TableBody,
    TableHead,
    // @ts-ignore
} from "@dhis2/ui";
import { DataElementItem } from "./DataElementItem";

export interface GridWithCatOptionCombosProps {
    dataFormInfo: DataFormInfo;
    section: SectionSimple;
}

const GridWithCatOptionCombos: React.FC<GridWithCatOptionCombosProps> = props => {
    const { dataFormInfo } = props;
    const classes = useStyles();
    const grid = React.useMemo(() => GridWithCatOptionCombosViewModel.get(props.section), [props.section]);

    return (
        <DataTableSection section={grid} dataFormInfo={dataFormInfo}>
            <DataTable className={classes.table} layout="fixed" width="initial">
                <TableHead>
                    <DataTableRow>
                        <DataTableColumnHeader width="400px" colSpan="2"></DataTableColumnHeader>

                        {grid.columns.map(column => (
                            <DataTableColumnHeader key={column.name}>
                                <span>{column.name}</span>
                            </DataTableColumnHeader>
                        ))}
                    </DataTableRow>
                </TableHead>

                <TableBody>
                    {grid.rows.map(row => {
                        const groupName = row.groupName;
                        const rows = row.rows;

                        return rows.map((row, idx) => (
                            <DataTableRow key={`${groupName}-${idx}`}>
                                {groupName ? (
                                    <>
                                        {idx === 0 && (
                                            <DataTableCell className={classes.rowTitle} rowSpan={rows.length}>
                                                <span>{groupName}</span>
                                            </DataTableCell>
                                        )}

                                        <DataTableCell>
                                            <span>{row.deName}</span>
                                        </DataTableCell>
                                    </>
                                ) : (
                                    <DataTableCell colSpan="2">
                                        <span>{row.deName}</span>
                                    </DataTableCell>
                                )}

                                {grid.columns.map(column => {
                                    const dataElement = column.items.find(item =>
                                        item.row.rows.map(row => row.deName).includes(row.deName)
                                    )?.dataElement;

                                    if (dataElement) {
                                        return (
                                            <DataTableCell key={[dataElement.id, column.name].join("-")}>
                                                <DataElementItem
                                                    dataElement={dataElement}
                                                    dataFormInfo={dataFormInfo}
                                                    noComment={
                                                        dataElement.name !== "Source type for HWF - (Inputs & Outputs)"
                                                    }
                                                />
                                            </DataTableCell>
                                        );
                                    }
                                })}
                            </DataTableRow>
                        ));
                    })}
                </TableBody>
            </DataTable>
        </DataTableSection>
    );
};

const useStyles = makeStyles({
    wrapper: { margin: 10 },
    header: { fontSize: "1.4em", fontWeight: "bold" as const },
    table: { borderWidth: "3px !important", minWidth: "100%" },
    columnWidth: { minWidth: "14.25em !important" },
    rowTitle: { fontSize: "1.2em", fontWeight: "bold" as const },
});

export default React.memo(GridWithCatOptionCombos);
