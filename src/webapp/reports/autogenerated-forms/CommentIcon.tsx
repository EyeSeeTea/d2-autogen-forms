import React from "react";
import { Id } from "../../../domain/common/entities/Base";
import i18n from "../../../locales";
import { useAppContext } from "../../contexts/app-context";
import { isDev } from "../../..";

export interface CommentIconProps {
    dataElementId: Id;
    categoryOptionComboId: Id;
    period: string;
    hasComment: boolean;
}

export const CommentIcon: React.FC<CommentIconProps> = React.memo(props => {
    const { dataElementId, period, categoryOptionComboId, hasComment } = props;
    const { api } = useAppContext();
    const tagId = `${period}-${dataElementId}-${categoryOptionComboId}-comment`;
    const title = i18n.t("View comment and audit history");

    const openHistoryModal = React.useCallback(() => {
        if (!isDev) {
            window.autogenFormCurrentPeriodId = period;
            window.viewHist(dataElementId, categoryOptionComboId, period);
        }
    }, [dataElementId, categoryOptionComboId, period]);

    return (
        <div style={styles.wrapper} onClick={openHistoryModal}>
            <img
                id={tagId}
                src={`${api.baseUrl}/images/comment.png`}
                alt={title}
                title={title}
                style={styles.image}
            ></img>
            {hasComment && <span style={styles.badge} />}
        </div>
    );
});

const styles: Record<string, React.CSSProperties> = {
    wrapper: { marginInlineStart: 10, position: "relative", display: "flex" },
    image: { cursor: "pointer" },
    badge: {
        position: "absolute",
        top: -2,
        right: -4,
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "#4CAF50",
        border: "1.5px solid white",
    },
};
