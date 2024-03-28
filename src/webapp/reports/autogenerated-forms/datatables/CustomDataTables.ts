import styled from "styled-components";

import {
    DataTableColumnHeader,
    DataTableCell, // @ts-ignore
} from "@dhis2/ui";

export const CustomDataTableColumnHeader = styled(DataTableColumnHeader)<{ backgroundColor: string }>`
    background-color: ${props => props.backgroundColor} !important;
`;

export const CustomDataTableCell = styled(DataTableCell)<{ backgroundColor: string }>`
    background-color: ${props => props.backgroundColor} !important;
`;

export const fixHeaderClasses = {
    fixedHeaders: {
        overflow: "auto",
        maxHeight: "100vh",
    },
};
