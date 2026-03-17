import { Backdrop, CircularProgress, makeStyles } from "@material-ui/core";
import React from "react";

type LoadingOverlayProps = {
    isLoading: boolean;
    text?: string;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = React.memo(props => {
    const { isLoading, text } = props;
    const classes = useStyles();

    return (
        <Backdrop className={classes.backdrop} open={isLoading} aria-live="polite">
            <CircularProgress color="inherit" />
            {text ? <div>{text}</div> : null}
        </Backdrop>
    );
});

const useStyles = makeStyles(theme => ({
    backdrop: {
        zIndex: theme.zIndex.modal + 1,
        color: theme.palette.primary.contrastText,
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(2),
    },
}));
