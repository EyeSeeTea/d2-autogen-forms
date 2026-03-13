import React from "react";
import { Button, Box, Typography } from "@material-ui/core";
import { ChevronLeft, ChevronRight } from "@material-ui/icons";
import i18n from "../../../locales";

export interface VisibleTab {
    readonly primaryIndex: number;
    readonly label: string;
}

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
        if (previousTab) onTabChange(previousTab.primaryIndex);
    }, [currentPosition, visibleTabs, onTabChange]);

    const handleNext = React.useCallback(() => {
        if (currentPosition >= visibleTabs.length - 1) return;
        const nextTab = visibleTabs[currentPosition + 1];
        if (nextTab) onTabChange(nextTab.primaryIndex);
    }, [currentPosition, visibleTabs, onTabChange]);

    const positionDisplay = currentPosition === -1 ? `0/${visibleTabs.length}` : `${currentPosition + 1}/${visibleTabs.length}`;

    return (
        <Box display="flex" alignItems="center" justifyContent="space-between" padding={1}>
            <Button
                startIcon={<ChevronLeft />}
                disabled={isFirst}
                onClick={handlePrevious}
                aria-label={i18n.t("Previous tab")}
            >
                {i18n.t("Previous")}
            </Button>

            <Typography variant="body1" aria-label={i18n.t("Tab position indicator")}>
                {positionDisplay}
            </Typography>

            <Button
                endIcon={<ChevronRight />}
                disabled={isLast}
                onClick={handleNext}
                aria-label={i18n.t("Next tab")}
            >
                {i18n.t("Next")}
            </Button>
        </Box>
    );
});

export default TabNavigation;
