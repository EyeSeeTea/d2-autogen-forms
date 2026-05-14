import React from "react";
import { HeaderBar as D2HeaderBar } from "@dhis2/ui";

type HeaderBarProps = {
    appName: string;
};

// Skip rendering when embedded in DHIS2 data-entry iframe — the shell already provides the header
export const HeaderBar: React.FC<HeaderBarProps> = ({ appName }) => {
    if (window.self !== window.top) return null;
    return <D2HeaderBar appName={appName} />;
};
