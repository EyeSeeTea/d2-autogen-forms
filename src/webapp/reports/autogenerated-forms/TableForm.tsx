import React from "react";

import { Section } from "../../../domain/common/entities/DataForm";
import { DataFormInfo } from "./AutogeneratedForm";
import { DataElementItem } from "./DataElementItem";
import { GridViewModel } from "./GridFormViewModel";

import {
    DataTable,
    TableHead,
    DataTableRow,
    TableBody, // @ts-ignore
} from "@dhis2/ui";
import { makeStyles } from "@material-ui/core";
import DataTableSection from "./DataTableSection";
import { CustomDataTableCell, CustomDataTableColumnHeader } from "./datatables/CustomDataTables";
import { DataTableCellRowName } from "./datatables/DataTableCellRowName";

export interface TableFormProps {
    dataFormInfo: DataFormInfo;
    section: Section;
}

const TableForm: React.FC<TableFormProps> = React.memo(props => {
    const { dataFormInfo } = props;
    const section = React.useMemo(() => GridViewModel.get(props.section, dataFormInfo), [props.section, dataFormInfo]);
    const classes = useStyles();

    return (
        <DataTableSection section={section} sectionStyles={props.section.styles} dataFormInfo={dataFormInfo}>
            <DataTable>
                <TableHead>
                    <DataTableRow>
                        <CustomDataTableColumnHeader
                            backgroundColor={props.section.styles.columns.backgroundColor}
                            colSpan="2"
                        >
                            <span className={classes.header}>{section.name}</span>
                        </CustomDataTableColumnHeader>
                    </DataTableRow>
                </TableHead>

                <TableBody>
                    {props.section.dataElements.map(dataElement => (
                        <DataTableRow key={dataElement.id}>
                            <CustomDataTableCell backgroundColor={props.section.styles.rows.backgroundColor}>
                                <DataTableCellRowName html={dataElement.htmlText} name={dataElement.name} />
                            </CustomDataTableCell>

                            <CustomDataTableCell
                                backgroundColor={props.section.styles.rows.backgroundColor}
                                key={dataElement.id}
                            >
                                <DataElementItem
                                    dataElement={dataElement}
                                    dataFormInfo={dataFormInfo}
                                    noComment={dataElement.disabledComments}
                                />
                            </CustomDataTableCell>
                        </DataTableRow>
                    ))}
                </TableBody>
            </DataTable>
        </DataTableSection>
    );
});

const useStyles = makeStyles({
    wrapper: { margin: 10 },
    header: { fontSize: "1.4em", fontWeight: "bold" as const },
    center: { display: "table", margin: "0 auto" },
    tableStyles: { backgroundColor: "aqua !important" },
});

export default React.memo(TableForm);
