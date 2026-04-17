import React from "react";
import { Tooltip } from "@material-ui/core";
import { version } from "../../../../package.json";
import styled from "styled-components";
import { InfoOutlined } from "@material-ui/icons";
import i18n from "../../../locales";

export const FormInfo: React.FC = () => {
    return (
        <Container>
            <Tooltip title={i18n.t("D2 Autogen Forms version: {{version}}", { version, nsSeparator: false })} arrow placement="left">
                <StyledInfoIcon />
            </Tooltip>
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
`;

const StyledInfoIcon = styled(InfoOutlined)`
    color: ${props => props.theme.palette.text.secondary};
    cursor: pointer;
`;
