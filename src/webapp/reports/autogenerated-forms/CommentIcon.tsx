import React from "react";
import { Id } from "../../../domain/common/entities/Base";
import i18n from "../../../locales";
import { useAppContext } from "../../contexts/app-context";

export interface CommentIconProps {
    dataElementId: Id;
    categoryOptionComboId: Id;
    period?: string;
}

export const CommentIcon: React.FC<CommentIconProps> = React.memo(props => {
    const { dataElementId, categoryOptionComboId, period } = props;
    const { api } = useAppContext();
    const tagId = `${dataElementId}-${categoryOptionComboId}-comment`;
    const title = i18n.t("View comment and audit history");
    
    const onClickCapture = React.useCallback(() => {
        // In DHIS2 Data Entry, built-in handlers sometimes use dhis2.de.getSelectedPeriod()
        // and sometimes read the selected period directly from globals/DOM.
        // Temporarily set both so the correct period is used for this cell.
        if (!period) return;
        const dhis2 = (window as any).dhis2;
        if (!dhis2 || !dhis2.de) return;

        const de = dhis2.de as any;
        const hasGetSelected = typeof de.getSelectedPeriod === "function";
        const originalGetSelectedPeriod = hasGetSelected ? de.getSelectedPeriod : undefined;

        // Cache previous DOM value if present
        const periodInput = window.document.getElementById("selectedPeriodId") as
            | HTMLInputElement
            | null;
        const previousDomValue = periodInput ? periodInput.value : undefined;

        try {
            // Primary: override API method
            if (hasGetSelected) {
                de.getSelectedPeriod = () => ({ iso: period });
            }
            // Secondary: populate common globals some handlers may read
            de.currentPeriod = period;
            de.currentPeriodId = period;
            de.currentPeriodIso = period;
            if (typeof de.setSelectedPeriod === "function") {
                try {
                    de.setSelectedPeriod({ iso: period });
                } catch (_) {
                    // ignore
                }
            }
            // Tertiary: update hidden input often used by legacy handlers
            if (periodInput) periodInput.value = period;
        } catch (_) {
            // noop
        }

        // Restore after the click handler runs
        setTimeout(() => {
            try {
                if (hasGetSelected && originalGetSelectedPeriod) de.getSelectedPeriod = originalGetSelectedPeriod;
                if (periodInput && typeof previousDomValue !== "undefined") periodInput.value = previousDomValue;
            } catch (_) {
                // noop
            }
        }, 0);
    }, [period]);

    return (
        <div style={styles.wrapper}>
            <img
                className="commentlink"
                id={tagId}
                src={`${api.baseUrl}/images/comment.png`}
                alt={title}
                title={title}
                style={styles.image}
                onClickCapture={onClickCapture}
            ></img>
        </div>
    );
});

const styles = {
    wrapper: { marginLeft: 10 },
    image: { cursor: "pointer" },
};
