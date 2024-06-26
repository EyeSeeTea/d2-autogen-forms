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
import _ from "lodash";
import { checkIndicatorDirection } from "../../../domain/common/entities/Indicator";
import { RowIndicatorItem } from "../../components/IndicatorItem/IndicatorItem";

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
                        {!_.isEmpty(section.columns) && (
                            <CustomDataTableColumnHeader
                                backgroundColor={props.section.styles.columns.backgroundColor}
                                colSpan="2"
                            >
                                <span className={classes.header}>{section.name}</span>
                            </CustomDataTableColumnHeader>
                        )}
                    </DataTableRow>
                </TableHead>

                <TableBody>
                    {section.dataElements.map(dataElement => {
                        return (
                            <React.Fragment key={dataElement.id}>
                                {dataElement.indicator && checkIndicatorDirection(dataElement.indicator, "before") && (
                                    <RowIndicatorItem
                                        indicator={dataElement.indicator}
                                        colSpan="0"
                                        dataFormInfo={dataFormInfo}
                                        periods={[dataFormInfo.period]}
                                    />
                                )}
                                <DataTableRow>
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
                                {dataElement.indicator && checkIndicatorDirection(dataElement.indicator, "after") && (
                                    <RowIndicatorItem
                                        indicator={dataElement.indicator}
                                        colSpan="0"
                                        dataFormInfo={dataFormInfo}
                                        periods={[dataFormInfo.period]}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}

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
});

const useStyles = makeStyles({
    wrapper: { margin: 10 },
    header: { fontSize: "1.4em", fontWeight: "bold" as const },
    center: { display: "table", margin: "0 auto" },
    tableStyles: { backgroundColor: "aqua !important" },
});

export default React.memo(TableForm);
