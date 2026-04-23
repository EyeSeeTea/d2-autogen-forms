import styled from "styled-components";

import {
    DataTableColumnHeader,
    DataTableCell, // @ts-ignore
} from "@dhis2/ui";
import React from "react";

export const CustomDataTableColumnHeader = styled(DataTableColumnHeader)<{
    backgroundColor: string;
    position?: React.CSSProperties["position"];
    left?: React.CSSProperties["left"];
}>`
    background-color: #ffffff !important;
    background-image: linear-gradient(${props => props.backgroundColor}, ${props => props.backgroundColor}) !important;
    ${props => props.position && `position: ${props.position} !important;`}
    ${props => props.left !== undefined && `left: ${props.left} !important;`}
    & > span {
        width: 100%;
    }
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
    position: ${props => (props.position ? props.position : "static")} !important;
    left: ${props => (props.left ? props.left : "auto")} !important;
    z-index: ${props => (props.zIndex ? props.zIndex : "0")} !important;
`;

export const fixHeaderClasses = {
    fixedHeaders: {
        overflow: "auto",
        maxHeight: "100vh",
    },
};
