import React from "react";
import { Html } from "../Html";

type DataTableCellRowNameProps = { html?: string; name: string };

export const DataTableCellRowName: React.FC<DataTableCellRowNameProps> = props => {
    return props.html ? <Html content={props.html} /> : <span>{props.name}</span>;
};
