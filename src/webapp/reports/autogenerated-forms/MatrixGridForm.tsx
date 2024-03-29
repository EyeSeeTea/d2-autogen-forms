import React from "react";
import {
    DataTable,
    DataTableCell,
    DataTableRow,
    TableBody,
    TableHead,
    // @ts-ignore
} from "@dhis2/ui";
import { makeStyles } from "@material-ui/core";
import { DataFormInfo } from "./AutogeneratedForm";
import { Section } from "../../../domain/common/entities/DataForm";
import DataTableSection from "./DataTableSection";
import { MatrixGridViewModel } from "./MatrixGridViewModel";
import { CustomDataTableColumnHeader } from "./datatables/CustomDataTables";
import { DataElementItem } from "./DataElementItem";

export interface MatrixGridFormProps {
    dataFormInfo: DataFormInfo;
    section: Section;
}

const MatrixGridForm: React.FC<MatrixGridFormProps> = props => {
    const { dataFormInfo, section } = props;
    const grid = React.useMemo(() => MatrixGridViewModel.get(section), [section]);
    const classes = useStyles();

    return (
        <DataTableSection section={grid} sectionStyles={props.section.styles} dataFormInfo={dataFormInfo}>
            <DataTable className={classes.table}>
                <TableHead>
                    <DataTableRow>
                        {grid.columns.map(column => (
                            <CustomDataTableColumnHeader
                                backgroundColor={props.section.styles.columns.backgroundColor}
                                colSpan={"2"}
                                key={column.columnHeader}
                            >
                                <span className={classes.header}>{column.columnHeader}</span>
                            </CustomDataTableColumnHeader>
                        ))}
                    </DataTableRow>
                    <DataTableRow>
                        {grid.columns.map(column => (
                            <CustomDataTableColumnHeader
                                backgroundColor={props.section.styles.columns.backgroundColor}
                                colSpan={"2"}
                                key={column.columnDescription}
                            >
                                <span>{column.columnDescription}</span>
                            </CustomDataTableColumnHeader>
                        ))}
                    </DataTableRow>
                </TableHead>

                <TableBody>
                    {grid.rows.map((row, index) => (
                        <DataTableRow key={index}>
                            {row.map(dataElement => (
                                <React.Fragment key={dataElement.id}>
                                    <DataTableCell key={dataElement.id}>{dataElement.name}</DataTableCell>
                                    <DataTableCell key={dataElement.name}>
                                        <DataElementItem dataElement={dataElement} dataFormInfo={dataFormInfo} />
                                    </DataTableCell>
                                </React.Fragment>
                            ))}
                        </DataTableRow>
                    ))}
                </TableBody>
            </DataTable>
        </DataTableSection>
    );
};

const useStyles = makeStyles({
    header: {
        fontSize: "1.2em",
        fontWeight: "bold",
        flexDirection: "column",
        textAlign: "center",
        display: "flex",
        padding: "4px",
    },
    table: { borderWidth: "3px !important" },
});

export default React.memo(MatrixGridForm);
