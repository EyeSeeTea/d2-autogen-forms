import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TabNavigation, { VisibleTab, TabNavigationProps } from "../TabNavigation";

const defaultTabs: ReadonlyArray<VisibleTab> = [
    { primaryIndex: 0 },
    { primaryIndex: 1 },
    { primaryIndex: 2 },
    { primaryIndex: 3 },
];

function renderNavigation(overrides: Partial<TabNavigationProps> = {}) {
    const onTabChange = vi.fn();
    const props: TabNavigationProps = {
        activeTabIndex: 0,
        visibleTabs: defaultTabs,
        onTabChange,
        ...overrides,
    };

    const result = render(<TabNavigation {...props} />);
    return { ...result, onTabChange };
}

function getPreviousButton(): HTMLButtonElement {
    return screen.getByRole("button", { name: /previous/i }) as HTMLButtonElement;
}

function getNextButton(): HTMLButtonElement {
    return screen.getByRole("button", { name: /next/i }) as HTMLButtonElement;
}

describe("TabNavigation", () => {
    describe("rendering", () => {
        it("renders Previous and Next buttons", () => {
            renderNavigation();

            expect(getPreviousButton().tagName).toBe("BUTTON");
            expect(getNextButton().tagName).toBe("BUTTON");
        });

        it("renders the position indicator with correct text", () => {
            renderNavigation({ activeTabIndex: 1 });

            expect(screen.getByText("2/4")).toBeTruthy();
        });
    });

    describe("position indicator", () => {
        it("shows 1/4 when on the first tab", () => {
            renderNavigation({ activeTabIndex: 0 });

            expect(screen.getByText("1/4").textContent).toBe("1/4");
        });

        it("shows 3/4 when on the third tab", () => {
            renderNavigation({ activeTabIndex: 2 });

            expect(screen.getByText("3/4").textContent).toBe("3/4");
        });

        it("shows 4/4 when on the last tab", () => {
            renderNavigation({ activeTabIndex: 3 });

            expect(screen.getByText("4/4").textContent).toBe("4/4");
        });

        it("shows correct position with non-contiguous primary indices", () => {
            const sparseVisibleTabs: ReadonlyArray<VisibleTab> = [
                { primaryIndex: 0 },
                { primaryIndex: 3 },
                { primaryIndex: 7 },
            ];

            renderNavigation({ activeTabIndex: 3, visibleTabs: sparseVisibleTabs });

            expect(screen.getByText("2/3").textContent).toBe("2/3");
        });
    });

    describe("Previous button", () => {
        it("is disabled when on the first visible tab", () => {
            renderNavigation({ activeTabIndex: 0 });

            expect(getPreviousButton().disabled).toBe(true);
        });

        it("is enabled when not on the first visible tab", () => {
            renderNavigation({ activeTabIndex: 2 });

            expect(getPreviousButton().disabled).toBe(false);
        });

        it("calls onTabChange with the previous tab primaryIndex when clicked", () => {
            const { onTabChange } = renderNavigation({ activeTabIndex: 2 });

            fireEvent.click(getPreviousButton());

            expect(onTabChange).toHaveBeenCalledTimes(1);
            expect(onTabChange).toHaveBeenCalledWith(1);
        });
    });

    describe("Next button", () => {
        it("is disabled when on the last visible tab", () => {
            renderNavigation({ activeTabIndex: 3 });

            expect(getNextButton().disabled).toBe(true);
        });

        it("is enabled when not on the last visible tab", () => {
            renderNavigation({ activeTabIndex: 1 });

            expect(getNextButton().disabled).toBe(false);
        });

        it("calls onTabChange with the next tab primaryIndex when clicked", () => {
            const { onTabChange } = renderNavigation({ activeTabIndex: 1 });

            fireEvent.click(getNextButton());

            expect(onTabChange).toHaveBeenCalledTimes(1);
            expect(onTabChange).toHaveBeenCalledWith(2);
        });
    });

    describe("scroll-to-top on navigation", () => {
        beforeEach(() => {
            window.scrollTo = vi.fn();
        });

        it("scrolls to top when Next is clicked", () => {
            renderNavigation({ activeTabIndex: 0 });

            fireEvent.click(getNextButton());

            expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        });

        it("scrolls to top when Previous is clicked", () => {
            renderNavigation({ activeTabIndex: 2 });

            fireEvent.click(getPreviousButton());

            expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        });

        it("does not scroll when Next is clicked on the last tab", () => {
            renderNavigation({ activeTabIndex: 3 });

            fireEvent.click(getNextButton());

            expect(window.scrollTo).not.toHaveBeenCalled();
        });

        it("does not scroll when Previous is clicked on the first tab", () => {
            renderNavigation({ activeTabIndex: 0 });

            fireEvent.click(getPreviousButton());

            expect(window.scrollTo).not.toHaveBeenCalled();
        });
    });

    describe("edge cases", () => {
        it("disables both buttons when there is only one visible tab", () => {
            const singleTab: ReadonlyArray<VisibleTab> = [{ primaryIndex: 5 }];
            renderNavigation({ activeTabIndex: 5, visibleTabs: singleTab });

            expect(getPreviousButton().disabled).toBe(true);
            expect(getNextButton().disabled).toBe(true);
            expect(screen.getByText("1/1").textContent).toBe("1/1");
        });

        it("shows 0/N when activeTabIndex is not in visibleTabs", () => {
            renderNavigation({ activeTabIndex: 99 });

            expect(screen.getByText("0/4").textContent).toBe("0/4");
        });
    });
});
