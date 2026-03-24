import _ from "lodash";
import { makeStyles } from "@material-ui/core";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { Section } from "../../../domain/common/entities/DataForm";
import { getTabIndices } from "./SectionsTabs";

type PrintTabHeader = {
    label: string;
    primaryIndex: number;
};

export interface PrintSectionsContentProps {
    tabbedSections: Section[];
    untabbedSections: Section[];
    tabHeaders: PrintTabHeader[];
    renderSection: (section: Section, key: string) => React.ReactNode;
}

const PrintContent: React.FC<PrintSectionsContentProps> = React.memo(props => {
    const { tabbedSections, untabbedSections, tabHeaders, renderSection } = props;
    useStyles();

    const getPrimaryTabIndex = useCallback((section: Section) => {
        const [primaryTabIndex] = getTabIndices(section.tabs.order);
        return primaryTabIndex;
    }, []);

    const printTabHeaders = useMemo(() => _.uniqBy(tabHeaders, "primaryIndex"), [tabHeaders]);

    return (
        <PrintOnlyContent>
            {printTabHeaders.map(tabHeader => {
                const sectionsByTab = tabbedSections.filter(
                    section => getPrimaryTabIndex(section) === tabHeader.primaryIndex
                );

                return (
                    <div key={`print-tab-${tabHeader.primaryIndex}`}>
                        <PrintTabLabel>{tabHeader.label}</PrintTabLabel>
                        {sectionsByTab.map(section => renderSection(section, "printSection"))}
                    </div>
                );
            })}

            {untabbedSections.length > 0 && (
                <div>
                    <PrintTabLabel>Others</PrintTabLabel>
                    {untabbedSections.map(section => renderSection(section, "printUntabbedSection"))}
                </div>
            )}
        </PrintOnlyContent>
    );
});

export default React.memo(PrintContent);

const useStyles = makeStyles({
    "@global": {
        "@media print": {
            "#completedByDiv, #completenessDiv, #fileDeleteConfirmationDialog": {
                display: "none !important",
            },
        },
    },
});

const PrintOnlyContent = styled.div`
    display: none;
    @media print {
        display: block;
    }
`;

const PrintTabLabel = styled.h3`
    margin: 1.5rem 0 0.75rem 0;
    padding: 0.75rem 1rem;
    background: #ffffff;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
    text-transform: uppercase;
    letter-spacing: 0.02857em;
    page-break-after: avoid;
`;
