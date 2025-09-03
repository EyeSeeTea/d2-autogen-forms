import styled from "styled-components";

import {
    DataTableColumnHeader,
    DataTableCell, // @ts-ignore
} from "@dhis2/ui";
import React from "react";

export const CustomDataTableColumnHeader = styled(DataTableColumnHeader)<{ backgroundColor: string }>`
    background-color: ${props => props.backgroundColor} !important;
`;

export const CustomDataTableCell = styled(DataTableCell)<{
    textAlign?: React.CSSProperties["textAlign"];
    writingMode?: React.CSSProperties["writingMode"];
    backgroundColor: string;
    position?: React.CSSProperties["position"];
    left?: React.CSSProperties["left"];
    zIndex?: React.CSSProperties["zIndex"];
}>`
    background-color: ${props => props.backgroundColor} !important;
    writing-mode: ${props => props.writingMode ?? "initial"} !important;
    text-align: ${props => props.textAlign ?? "initial"} !important;
    position: ${props => (props.position ? props.position : "initial")} !important;
    left: ${props => (props.left ? props.left : "initial")} !important;
    z-index: ${props => (props.zIndex ? props.zIndex : "initial")} !important;
`;

export const fixHeaderClasses = {
    fixedHeaders: {
        overflow: "auto",
        maxHeight: "100vh",
    },
};
