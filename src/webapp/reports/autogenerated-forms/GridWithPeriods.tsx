import React from "react";
import {
    DataTable,
    TableHead,
    DataTableRow,
    DataTableColumnHeader,
    TableBody,
    DataTableCell,
    // @ts-ignore
} from "@dhis2/ui";
import { GridWithPeriodsViewModel } from "./GridWithPeriodsViewModel";
import { DataFormInfo } from "./AutogeneratedForm";
import { SectionWithPeriods } from "../../../domain/common/entities/DataForm";
import { DataElementItem } from "./DataElementItem";
import { makeStyles } from "@material-ui/core";
import { DataElement } from "../../../domain/common/entities/DataElement";
import DataTableSection from "./DataTableSection";
import { Html } from "./Html";

/*
 * Convert data forms into table, using "-" as a separator. An example for section ITNs:
 *
 *    - ITNs - Basic
 *    - ITNs - Extended - Written Policy
 *    - ITNs - Extended - Policy Implemented
 *    - ITNs - Extended - Policy Extra
 *
 *    This will create this table:
 *
 *
 *    ITNs                                   |  2020  |  2021  |  2022   |
 *    --------------------------------------------------------------------
 *    ITNs - Basic                           |        |        |         |
 *                     | Written Policy      |        |        |         |
 *    ITNs - Extended  | Policy Implemented  |        |        |         |
 *                     | Policy Extra        |        |        |         |
 **/

export interface GridWithPeriodsProps {
    dataFormInfo: DataFormInfo;
    section: SectionWithPeriods;
}

const GridWithPeriods: React.FC<GridWithPeriodsProps> = props => {
    const { dataFormInfo } = props;
    const grid = React.useMemo(() => GridWithPeriodsViewModel.get(props.section), [props.section]);
    const classes = useStyles();

    return (
        <DataTableSection section={grid} dataFormInfo={dataFormInfo}>
            <DataTable className={classes.table}>
                <TableHead>
                    <DataTableRow>
                        <DataTableColumnHeader width="400px" colSpan="2"></DataTableColumnHeader>

                        {grid.periods.map(period => (
                            <DataTableColumnHeader key={period}>
                                <span>{period}</span>
                            </DataTableColumnHeader>
                        ))}
                    </DataTableRow>
                </TableHead>

                <TableBody>
                    {grid.rows.map(row => {
                        switch (row.type) {
                            case "dataElement":
                                return (
                                    <DataTableRow key={row.dataElement.id}>
                                        <DataTableCell colSpan="2">
                                            <span>{row.dataElement.name}</span>
                                        </DataTableCell>

                                        <DataTableDataElementCell
                                            periods={grid.periods}
                                            dataElement={row.dataElement}
                                            dataFormInfo={dataFormInfo}
                                        />
                                    </DataTableRow>
                                );
                            case "dataElementFile":
                                return (
                                    <DataTableRow key={row.dataElement.id}>
                                        <DataTableCell colSpan="2">
                                            <span>{row.dataElement.name}</span>
                                            <Html content={row.dataElement.description}></Html>
                                        </DataTableCell>

                                        <DataTableCell colSpan={grid.periods.length.toString()}>
                                            <DataTableCell>
                                                <DataElementItem
                                                    dataElement={row.dataElement}
                                                    dataFormInfo={dataFormInfo}
                                                />
                                            </DataTableCell>
                                        </DataTableCell>
                                    </DataTableRow>
                                );

                            case "group":
                                return row.rows.map((row2, idx) => (
                                    <DataTableRow key={`${idx}-${row.name}`}>
                                        {idx === 0 && (
                                            <DataTableCell
                                                rowSpan={row.rows.length.toString()}
                                                className={classes.rowTitle}
                                            >
                                                <span>{row.name}</span>
                                            </DataTableCell>
                                        )}

                                        <DataTableCell>
                                            <span>{row2.dataElement.name}</span>
                                        </DataTableCell>

                                        <DataTableDataElementCell
                                            periods={grid.periods}
                                            dataElement={row2.dataElement}
                                            dataFormInfo={dataFormInfo}
                                        />
                                    </DataTableRow>
                                ));
                        }
                    })}
                </TableBody>
            </DataTable>
        </DataTableSection>
    );
};

interface DataTableDataElementCellProps {
    dataElement: DataElement;
    dataFormInfo: DataFormInfo;
    periods: string[];
}

const DataTableDataElementCell: React.FC<DataTableDataElementCellProps> = props => {
    const { dataElement, dataFormInfo, periods } = props;

    return (
        <>
            {periods.map(period => (
                <DataTableCell key={[dataElement.id, period].join("-")}>
                    <DataElementItem dataElement={dataElement} dataFormInfo={dataFormInfo} period={period} />
                </DataTableCell>
            ))}
        </>
    );
};

const useStyles = makeStyles({
    wrapper: { margin: 10 },
    header: { fontSize: "1.4em", fontWeight: "bold" as const },
    table: { borderWidth: "3px !important" },
    center: { textAlign: "center" },
    rowTitle: { fontSize: "1.2em", fontWeight: "bold" as const },
});

export default React.memo(GridWithPeriods);
