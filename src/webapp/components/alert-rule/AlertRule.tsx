import React from "react";
import styled from "styled-components";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import InfoIcon from "@material-ui/icons/Info";

export type AlertProps = { message: string; visible: boolean; onClose: () => void };

export const AlertRule: React.FC<AlertProps> = props => {
    const { message, onClose, visible } = props;

    if (!visible) return null;

    return (
        <AlertContent>
            <InfoIcon color="primary" />
            <p>{message}</p>
            <IconButton onClick={() => onClose()} size="small">
                <CloseIcon />
            </IconButton>
        </AlertContent>
    );
};

export const AlertContent = styled.div`
    align-items: center;
    display: flex;
    background-color: #d1ecf1;
    gap: 1em;
    padding: 1em;

    p {
        margin: 0;
        padding: 0;
    }
`;
