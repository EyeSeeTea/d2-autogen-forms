import React from "react";
// @ts-ignore
import { HeaderBar as D2HeaderBar } from "@dhis2/ui";
import styled from "styled-components";

type HeaderBarProps = {
    appName: string;
};

// Skip rendering when embedded in DHIS2 data-entry iframe — the shell already provides the header
export const HeaderBar: React.FC<HeaderBarProps> = ({ appName }) => {
    if (window.self !== window.top) return null;

    return (
        <Wrapper>
            <D2HeaderBar appName={appName} />
        </Wrapper>
    );
};

const Wrapper = styled.div`
    & div:first-of-type {
        box-sizing: border-box;
    }
`;
