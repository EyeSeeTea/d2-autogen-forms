import { useMemo } from "react";
import { getTabIndices, TabPanelProps } from "../SectionsTabs";
import { getSectionVisibilityState } from "./useSectionVisibility";
import { Maybe } from "../../../../utils/ts-utils";

type TabVisibilityState = {
    tabVisibilityByIndex: Record<number, boolean>;
    firstVisibleTabIndex: Maybe<number>;
};

export function useTabVisibility(props: TabPanelProps): TabVisibilityState {
    const { tabbedSections, untabbedSections, dataFormInfo } = props;

    const tabVisibilityByIndex = useMemo(() => {
        const acc = tabbedSections.reduce<Record<number, boolean>>((acc, section) => {
            const [primaryTabIndex] = getTabIndices(section.tabs.order);
            if (!Number.isFinite(primaryTabIndex) || primaryTabIndex === -1) return acc;

            const { isVisible } = getSectionVisibilityState(section, dataFormInfo);
            if (isVisible) acc[primaryTabIndex] = true;

            return acc;
        }, {});

        const hasVisibleUntabbedSection = untabbedSections.some(
            section => getSectionVisibilityState(section, dataFormInfo).isVisible
        );
        if (hasVisibleUntabbedSection) acc[-1] = true;

        return acc;
    }, [tabbedSections, untabbedSections, dataFormInfo]);

    const sortedVisibleTabIndices = useMemo(
        () =>
            Object.keys(tabVisibilityByIndex)
                .map(Number)
                .filter(Number.isFinite)
                .sort((a, b) => a - b),
        [tabVisibilityByIndex]
    );

    const firstVisibleTabIndex = sortedVisibleTabIndices[0];

    return { tabVisibilityByIndex, firstVisibleTabIndex };
}
