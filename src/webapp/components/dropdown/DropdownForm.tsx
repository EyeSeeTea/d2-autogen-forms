import React, { ReactNode } from "react";
import { createTheme, FormControl, InputLabel, MuiThemeProvider } from "@material-ui/core";
import cyan from "@material-ui/core/colors/cyan";

interface DropdownFormProps {
    label: string;
    children: ReactNode;
    className?: string;
}

const DropdownForm: React.FC<DropdownFormProps> = props => {
    const { label, children, className } = props;
    const materialTheme = getMaterialTheme();

    return (
        <MuiThemeProvider theme={materialTheme}>
            <FormControl className={className}>
                <InputLabel>{label}</InputLabel>
                {children}
            </FormControl>
        </MuiThemeProvider>
    );
};

const getMaterialTheme = () =>
    createTheme({
        overrides: {
            MuiFormLabel: {
                root: {
                    color: "#aaaaaa",
                    "&$focused": {
                        color: "#aaaaaa",
                    },
                    insetBlockStart: "-9px !important",
                    marginInlineStart: 10,
                },
            },
            MuiInput: {
                root: {
                    marginInlineStart: 10,
                },
                formControl: {
                    minWidth: 200,
                    marginBlockStart: "8px !important",
                },
                input: {
                    color: "#565656",
                },
                underline: {
                    "&&&&:hover:before": {
                        borderBlockEnd: `1px solid #bdbdbd`,
                    },
                    "&:hover:not($disabled):before": {
                        borderBlockEnd: `1px solid #aaaaaa`,
                    },
                    "&:after": {
                        borderBlockEnd: `2px solid ${cyan["500"]}`,
                    },
                    "&:before": {
                        borderBlockEnd: `1px solid #bdbdbd`,
                    },
                },
            },
        },
    });

export default React.memo(DropdownForm);
