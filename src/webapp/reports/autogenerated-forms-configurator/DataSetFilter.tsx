import { Dropdown, DropdownProps } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/d2-ui-components/locales";
import React, { useCallback } from "react";
import styled from "styled-components";
import { Option } from "./hooks/useFilters";
import { Code } from "../../../domain/common/entities/Base";

type ConfiguratorFiltersProps = {
    dataSetItems: Option[];
    dataSetCode: Code;
    onChange: (dataSetCode: Code) => void;
};

export const DataSetFilter: React.FC<ConfiguratorFiltersProps> = React.memo(props => {
    const { dataSetItems, dataSetCode, onChange } = props;

    const setDataSet = useCallback<SingleDropdownHandler>(
        dataSetCode => {
            if (dataSetCode) onChange(dataSetCode);
        },
        [onChange]
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
        </Container>
    );
});

const Container = styled.div`
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
`;

const SingleDropdownStyled = styled(Dropdown)`
    width: 35rem;
`;

type SingleDropdownHandler = DropdownProps["onChange"];
