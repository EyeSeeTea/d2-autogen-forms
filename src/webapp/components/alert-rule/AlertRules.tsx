import React from "react";
import styled from "styled-components";
import { AlertRule } from "./AlertRule";
import { IframeEscapePortal } from "../iframe-escape-portal/IframeEscapePortal";
import {
    IgnoreValidationRule,
    isSameValidationRule,
    ValidationResult,
} from "../../../domain/common/entities/ValidationResult";
import i18n from "../../../locales";

interface AlertRulesProps {
    rules: ValidationResult[];
    ignoreRules: IgnoreValidationRule[];
    onCloseAlert: (rule: ValidationResult) => void;
}

export const AlertRules: React.FC<AlertRulesProps> = ({ rules, ignoreRules, onCloseAlert }) => {
    const visibleRules = React.useMemo(
        () => rules.filter(rule => !ignoreRules.some(ignoreRule => isSameValidationRule(rule, ignoreRule))),
        [rules, ignoreRules]
    );

    const handleMarkAllAsRead = () => {
        visibleRules.forEach(rule => onCloseAlert(rule));
    };

    if (rules.length === 0) return null;

    return (
        <IframeEscapePortal hostId={"autogen-forms-alert-host"}>
            <AlertContainer>
                {rules.map(rule => {
                    const isVisible = visibleRules.includes(rule);
                    return (
                        <AlertRule
                            onClose={() => onCloseAlert(rule)}
                            key={rule.validationRuleId}
                            visible={isVisible}
                            message={rule.message}
                        />
                    );
                })}
                {visibleRules.length > 1 && (
                    <MarkAllAsReadButton onClick={handleMarkAllAsRead}>
                        {i18n.t("Mark all notifications as read")}
                    </MarkAllAsReadButton>
                )}
            </AlertContainer>
        </IframeEscapePortal>
    );
};

const AlertContainer = styled.div`
    bottom: 15px;
    display: flex;
    flex-direction: column;
    gap: 1em;
    max-width: 400px;
    pointer-events: auto;
    position: absolute;
    right: 15px;
`;

const MarkAllAsReadButton = styled.div`
    align-items: center;
    background-color: #e8f4f8;
    cursor: pointer;
    display: flex;
    justify-content: center;
    padding: 1em;
    transition: background-color 0.2s ease;
    font-weight: 500;
    color: #0277bd;
    font-size: 0.9em;

    &:hover {
        background-color: #d1ecf1;
    }
`;
