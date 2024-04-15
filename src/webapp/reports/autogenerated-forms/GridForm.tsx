import React from "react";
import {
    DataTable,
    TableHead,
    DataTableRow,
    TableBody,
    // @ts-ignore
} from "@dhis2/ui";
import { GridViewModel } from "./GridFormViewModel";
import { DataFormInfo } from "./AutogeneratedForm";
import { SectionWithTotals } from "../../../domain/common/entities/DataForm";
import { DataElementItem } from "./DataElementItem";
import { makeStyles } from "@material-ui/core";
import DataTableSection from "./DataTableSection";
import { CustomDataTableCell, CustomDataTableColumnHeader } from "./datatables/CustomDataTables";
import { DataTableCellFormula } from "./datatables/DataTableCellFormula";
import { DataTableCellRowName } from "./datatables/DataTableCellRowName";
import _ from "lodash";
import { RowIndicatorItem } from "../../components/IndicatorItem/IndicatorItem";

/*
 * Convert data forms into table, using "-" as a separator. An example for section ITNs:
 *
 *    - ITNs - Basic - Written Policy
 *    - ITNs - Basic - Policy Implemented
 *    - ITNs - Extended - Written Policy
 *    - ITNs - Extended - Policy Implemented
 *
 *    This will create this table:
 *
 *    ITNs            | Written Policy | Policy Implemented |
 *    ITNs - Basic    |                |                    |
 *    ITNs - Extended |                |                    |
 **/

export interface GridFormProps {
    dataFormInfo: DataFormInfo;
    section: SectionWithTotals;
}

const GridForm: React.FC<GridFormProps> = props => {
    const { dataFormInfo, section } = props;
    const grid = React.useMemo(() => GridViewModel.get(section, dataFormInfo), [section, dataFormInfo]);
    const classes = useStyles();

    return (
        <DataTableSection section={grid} sectionStyles={props.section.styles} dataFormInfo={dataFormInfo}>
            <DataTable className={classes.table}>
                <TableHead>
                    <DataTableRow>
                        {grid.useIndexes ? (
                            <CustomDataTableColumnHeader
                                backgroundColor={props.section.styles.columns.backgroundColor}
                                width="30px"
                            >
                                <span className={classes.header}>#</span>{" "}
                            </CustomDataTableColumnHeader>
                        ) : (
                            !_.isEmpty(grid.rows) && (
                                <CustomDataTableColumnHeader
                                    backgroundColor={props.section.styles.columns.backgroundColor}
                                    width="800px"
                                ></CustomDataTableColumnHeader>
                            )
                        )}

                        {grid.columns.map(column => (
                            <CustomDataTableColumnHeader
                                backgroundColor={props.section.styles.columns.backgroundColor}
                                className={classes.columnWidth}
                                key={`column-${column.name}`}
                            >
                                <div className={classes.header}>
                                    <span>{column.name}</span>
                                    <span
                                        className={classes.description}
                                        dangerouslySetInnerHTML={{ __html: column.description || "" }}
                                    ></span>
                                </div>
                            </CustomDataTableColumnHeader>
                        ))}
                    </DataTableRow>
                </TableHead>

                <TableBody>
                    {grid.rows.map((row, idx) => (
                        <DataTableRow key={`policy-${row.name}`}>
                            <CustomDataTableCell backgroundColor={props.section.styles.rows.backgroundColor}>
                                <DataTableCellRowName
                                    html={row.htmlText}
                                    name={grid.useIndexes ? (idx + 1).toString() : row.name}
                                />
                            </CustomDataTableCell>

                            {row.items.map((item, idx) =>
                                item.dataElement ? (
                                    <CustomDataTableCell
                                        backgroundColor={props.section.styles.rows.backgroundColor}
                                        key={item.dataElement.id}
                                    >
                                        <DataElementItem
                                            columnTotal={item.columnTotal}
                                            columnDataElements={item.columnDataElements}
                                            manualyDisabled={item.disabled}
                                            noComment={item.disableComments}
                                            dataElement={item.dataElement}
                                            dataFormInfo={dataFormInfo}
                                        />
                                    </CustomDataTableCell>
                                ) : (
                                    <CustomDataTableCell
                                        backgroundColor={props.section.styles.rows.backgroundColor}
                                        key={`cell-${idx}`}
                                    ></CustomDataTableCell>
                                )
                            )}
                        </DataTableRow>
                    ))}
                    {grid.summary && (
                        <DataTableRow key="total-custom-row">
                            <CustomDataTableCell
                                backgroundColor={props.section.styles.totals.backgroundColor}
                                key="total-column-name"
                            >
                                {grid.summary.cellName}
                            </CustomDataTableCell>
                            {grid.summary.cells.map(itemTotal => {
                                return (
                                    <DataTableCellFormula
                                        key={itemTotal.columnName}
                                        dataFormInfo={dataFormInfo}
                                        styles={props.section.styles}
                                        total={itemTotal}
                                        formula={itemTotal.formula}
                                    />
                                );
                            })}
                        </DataTableRow>
                    )}

                    {section.indicators.map(indicator => {
                        return (
                            <RowIndicatorItem
                                key={`parent_${indicator.id}`}
                                indicator={indicator}
                                colSpan="0"
                                dataFormInfo={dataFormInfo}
                                periods={[dataFormInfo.period]}
                            />
                        );
                    })}
                </TableBody>
            </DataTable>
        </DataTableSection>
    );
};

const useStyles = makeStyles({
    wrapper: { margin: 10 },
    header: {
        fontSize: "1.2em",
        fontWeight: "bold",
        flexDirection: "column",
        textAlign: "center",
        display: "flex",
        padding: "4px",
    },
    description: { fontWeight: "normal", fontSize: "0.8em" },
    table: { borderWidth: "3px !important" },
    columnWidth: { minWidth: "14.25em !important" },
});

export default React.memo(GridForm);
