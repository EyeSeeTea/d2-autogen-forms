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
import { GridWithPeriodsI, DataElementSubGroupRow, GridWithPeriodsViewModel } from "./GridWithPeriodsViewModel";
import { DataFormInfo } from "./AutogeneratedForm";
import { SectionWithPeriods } from "../../../domain/common/entities/DataForm";
import { DataElementItem } from "./DataElementItem";
import { makeStyles, Tabs, Tab } from "@material-ui/core";
import { DataElement } from "../../../domain/common/entities/DataElement";
import DataTableSection from "./DataTableSection";
import { Html } from "./Html";
import { DataTableCellRowName } from "./datatables/DataTableCellRowName";
import { CustomDataTableCell } from "./datatables/CustomDataTables";
import { DataTableCellFormula } from "./datatables/DataTableCellFormula";

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
    const [activeTab, setActiveTab] = React.useState(0);
    const { section, dataFormInfo } = props;
    const grid = React.useMemo(() => GridWithPeriodsViewModel.get(props.section), [props.section]);

    const handleChange = (_: React.ChangeEvent<{}>, value: number) => {
        setActiveTab(value);
    };

    const categoryOptionCombination = grid.tabs[activeTab]?.id;

    return (
        <DataTableSection section={grid} dataFormInfo={dataFormInfo}>
            {grid.tabs.length > 0 ? (
                <>
                    <Tabs value={activeTab} onChange={handleChange}>
                        {grid.tabs.map(tabPeriod => {
                            return <Tab key={tabPeriod.id + "Tab"} label={tabPeriod.name} />;
                        })}
                    </Tabs>
                    {grid.tabs.map(tabPeriod => {
                        if (tabPeriod.id !== categoryOptionCombination) return null;
                        return (
                            <PeriodTable
                                categoryOptionComboId={tabPeriod.id}
                                key={`${tabPeriod.id}_table`}
                                grid={grid}
                                dataFormInfo={dataFormInfo}
                                section={section}
                            />
                        );
                    })}
                </>
            ) : (
                <PeriodTable section={section} grid={grid} dataFormInfo={dataFormInfo} />
            )}
        </DataTableSection>
    );
};

type PeriodTableProps = {
    dataFormInfo: DataFormInfo;
    categoryOptionComboId?: string;
    grid: GridWithPeriodsI;
    section: SectionWithPeriods;
};

const PeriodTable: React.FC<PeriodTableProps> = props => {
    const { grid, dataFormInfo, categoryOptionComboId, section } = props;
    const classes = useStyles();

    const hasRowsWithSubGroups = grid.rows.some(row => row.type === "subGroup");

    return (
        <DataTable className={classes.table}>
            <TableHead>
                <DataTableRow>
                    <DataTableColumnHeader
                        width="400px"
                        colSpan={hasRowsWithSubGroups ? "3" : "2"}
                    ></DataTableColumnHeader>
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
                                    <DataTableCell colSpan={hasRowsWithSubGroups ? "3" : "2"}>
                                        <span>{row.dataElement.name}</span>
                                    </DataTableCell>

                                    <DataTableDataElementCell
                                        periods={grid.periods}
                                        dataElement={row.dataElement}
                                        dataFormInfo={dataFormInfo}
                                        categoryOptionComboId={categoryOptionComboId}
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
                                                noComment={row.dataElement.disabledComments}
                                                dataElement={{ ...row.dataElement, cocId: categoryOptionComboId }}
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

                                    <DataTableCell colSpan={grid.rows.some(row => row.type === "subGroup") ? "2" : "0"}>
                                        <DataTableCellRowName
                                            html={row2.dataElement.htmlText}
                                            name={row2.dataElement.name}
                                        />
                                    </DataTableCell>

                                    <DataTableDataElementCell
                                        periods={grid.periods}
                                        dataElement={row2.dataElement}
                                        dataFormInfo={dataFormInfo}
                                        categoryOptionComboId={categoryOptionComboId}
                                    />
                                </DataTableRow>
                            ));
                        case "subGroup":
                            return row.rows.map((subGroupRow: DataElementSubGroupRow) => {
                                return (
                                    <DataTableRow key={subGroupRow.dataElement.id}>
                                        {subGroupRow.groupName && (
                                            <DataTableCell
                                                rowSpan={row.rows.length.toString()}
                                                className={classes.rowTitle}
                                            >
                                                <span>{subGroupRow.groupName}</span>
                                            </DataTableCell>
                                        )}

                                        {subGroupRow.subGroup && (
                                            <DataTableCell
                                                rowSpan={subGroupRow.dataElementsPerSubGroup.toString()}
                                                className={classes.rowTitle}
                                            >
                                                <span>{subGroupRow.subGroup}</span>
                                            </DataTableCell>
                                        )}

                                        <DataTableCell colSpan={subGroupRow.colSpan}>
                                            <span>{subGroupRow.dataElement.name}</span>
                                        </DataTableCell>

                                        <DataTableDataElementCell
                                            periods={grid.periods}
                                            dataElement={subGroupRow.dataElement}
                                            dataFormInfo={dataFormInfo}
                                        />
                                    </DataTableRow>
                                );
                            });
                    }
                })}
                {grid.summary && (
                    <DataTableRow key="total-custom-row">
                        <CustomDataTableCell key="total-column-name-periods" colSpan={hasRowsWithSubGroups ? "3" : "2"}>
                            <Html content={grid.summary.cellName} />
                        </CustomDataTableCell>
                        {grid.summary.cells.map(itemTotal => {
                            return (
                                <DataTableCellFormula
                                    key={itemTotal.columnName}
                                    dataFormInfo={dataFormInfo}
                                    styles={section.styles}
                                    total={itemTotal}
                                    formula={itemTotal.formula}
                                    period={itemTotal.columnName}
                                />
                            );
                        })}
                    </DataTableRow>
                )}
            </TableBody>
        </DataTable>
    );
};

interface DataTableDataElementCellProps {
    dataElement: DataElement;
    dataFormInfo: DataFormInfo;
    periods: string[];
    categoryOptionComboId?: string;
}

const DataTableDataElementCell: React.FC<DataTableDataElementCellProps> = props => {
    const { dataElement, dataFormInfo, periods, categoryOptionComboId } = props;
    const cocId = categoryOptionComboId || dataElement.cocId;

    return (
        <>
            {periods.map(period => (
                <DataTableCell key={[dataElement.id, period].join("-")}>
                    <DataElementItem
                        noComment={dataElement.disabledComments}
                        dataElement={{ ...dataElement, cocId: cocId }}
                        dataFormInfo={dataFormInfo}
                        period={period}
                    />
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
