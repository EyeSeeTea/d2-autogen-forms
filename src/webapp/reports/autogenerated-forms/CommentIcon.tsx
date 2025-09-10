import React from "react";
import { Id } from "../../../domain/common/entities/Base";
import i18n from "../../../locales";
import { useAppContext } from "../../contexts/app-context";
import { isDev } from "../../..";

export interface CommentIconProps {
    dataElementId: Id;
    categoryOptionComboId: Id;
    period: string;
}

export const CommentIcon: React.FC<CommentIconProps> = React.memo(props => {
    const { dataElementId, period, categoryOptionComboId } = props;
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
        </div>
    );
});

const styles = {
    wrapper: { marginLeft: 10 },
    image: { cursor: "pointer" },
};
