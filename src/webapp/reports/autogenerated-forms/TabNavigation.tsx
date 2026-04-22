import React from "react";
import { Button, Box, Typography } from "@material-ui/core";
import { ChevronLeft, ChevronRight } from "@material-ui/icons";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { VisibleTab } from "./hooks/useTabVisibility";
import styled from "styled-components";

export type { VisibleTab };

export interface TabNavigationProps {
    readonly activeTabIndex: number;
    readonly visibleTabs: ReadonlyArray<VisibleTab>;
    readonly onTabChange: (primaryIndex: number) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = React.memo(props => {
    const { activeTabIndex, visibleTabs, onTabChange } = props;

    const currentPosition = visibleTabs.findIndex(tab => tab.primaryIndex === activeTabIndex);
    const isFirst = currentPosition <= 0;
    const isLast = currentPosition >= visibleTabs.length - 1;

    const handlePrevious = React.useCallback(() => {
        if (currentPosition <= 0) return;
        const previousTab = visibleTabs[currentPosition - 1];
        if (previousTab) {
            onTabChange(previousTab.primaryIndex);
            window.scrollTo(0, 0);
        }
    }, [currentPosition, visibleTabs, onTabChange]);

    const handleNext = React.useCallback(() => {
        if (currentPosition >= visibleTabs.length - 1) return;
        const nextTab = visibleTabs[currentPosition + 1];
        if (nextTab) {
            onTabChange(nextTab.primaryIndex);
            window.scrollTo(0, 0);
        }
    }, [currentPosition, visibleTabs, onTabChange]);

    const positionDisplay =
        currentPosition === -1 ? `0/${visibleTabs.length}` : `${currentPosition + 1}/${visibleTabs.length}`;

    return (
        <Box display="flex" alignItems="center" justifyContent="space-between" padding={1}>
            <StyledButton
                startIcon={<ChevronLeft />}
                disabled={isFirst}
                onClick={handlePrevious}
                aria-label={i18n.t("Previous tab")}
            >
                {i18n.t("Previous")}
            </StyledButton>

            <StyledTypography variant="body1" aria-label={i18n.t("Tab position indicator")}>
                {positionDisplay}
            </StyledTypography>

            <StyledButton endIcon={<ChevronRight />} disabled={isLast} onClick={handleNext} aria-label={i18n.t("Next tab")}>
                {i18n.t("Next")}
            </StyledButton>
        </Box>
    );
});

const StyledButton = styled(Button)`
   font-size: 12.25px;
`

const StyledTypography = styled(Typography)`
    font-size: 12px; 
`

export default TabNavigation;
