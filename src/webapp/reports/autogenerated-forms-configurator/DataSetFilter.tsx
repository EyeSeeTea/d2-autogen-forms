import { Dropdown, DropdownProps } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/d2-ui-components/locales";
import React, { useCallback } from "react";
import styled from "styled-components";
import { Option } from "./hooks/useFilters";
import { Code } from "../../../domain/common/entities/Base";
import { DataSetViewModel } from "./hooks/useConfigurator";

type ConfiguratorFiltersProps = {
    dataSetItems: Option[];
    dataSetCode: Code;
    onChange: (dataSet: DataSetViewModel) => void;
    helperText?: string;
};

export const DataSetFilter: React.FC<ConfiguratorFiltersProps> = React.memo(props => {
    const { dataSetItems, dataSetCode, onChange, helperText } = props;

    const setDataSet = useCallback<SingleDropdownHandler>(
        dataSetCode => {
            const dataSet = dataSetItems.find(ds => ds.value === dataSetCode);
            if (dataSet)
                onChange({
                    code: dataSet.value,
                    name: dataSet.text,
                });
        },
        [dataSetItems, onChange]
    );

    return (
        <Container>
            <SingleDropdownStyled
                items={dataSetItems}
                value={dataSetCode}
                onChange={setDataSet}
                label={i18n.t("Select dataset")}
                hideEmpty
            />
            {helperText && <HelperText>{helperText}</HelperText>}
        </Container>
    );
});

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex-wrap: wrap;
`;

const SingleDropdownStyled = styled(Dropdown)`
    width: 35rem;
`;

const HelperText = styled.span`
    font-size: 0.875rem;
    color: ${props => props.theme.palette.text.secondary};
    margin-left: 10px;
`;

type SingleDropdownHandler = DropdownProps["onChange"];
