import React from "react";

type UseSyncedScrollReturn = {
    wrapper1Ref: React.RefObject<HTMLDivElement>;
    wrapper2Ref: React.RefObject<HTMLDivElement>;
    wrapper2Width: number;
};

export const useSyncedScroll = (props: { enable: boolean }): UseSyncedScrollReturn => {
    const { enable } = props;
    const wrapper1Ref = React.useRef<HTMLDivElement>(null);
    const wrapper2Ref = React.useRef<HTMLDivElement>(null);
    const [width2, setTableWidth2] = React.useState(0);

    React.useEffect(() => {
        if (!enable) return;

        const wrapper1 = wrapper1Ref.current;
        const wrapper2 = wrapper2Ref.current;

        if (!wrapper1 || !wrapper2) return;

        const handleScroll1 = () => {
            if (wrapper2.scrollLeft !== wrapper1.scrollLeft) {
                wrapper2.scrollLeft = wrapper1.scrollLeft;
            }
        };

        const handleScroll2 = () => {
            if (wrapper1.scrollLeft !== wrapper2.scrollLeft) {
                wrapper1.scrollLeft = wrapper2.scrollLeft;
            }
        };

        wrapper1.addEventListener("scroll", handleScroll1);
        wrapper2.addEventListener("scroll", handleScroll2);

        return () => {
            wrapper1.removeEventListener("scroll", handleScroll1);
            wrapper2.removeEventListener("scroll", handleScroll2);
        };
    }, [enable]);

    React.useEffect(() => {
        if (!wrapper2Ref.current || !enable) return;

        const el = wrapper2Ref.current.firstElementChild as HTMLElement | null;
        if (!el) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setTableWidth2(entry.contentRect.width);
            }
        });

        observer.observe(el);

        return () => observer.disconnect();
    }, [enable]);

    return { wrapper2Width: width2, wrapper1Ref, wrapper2Ref };
};
