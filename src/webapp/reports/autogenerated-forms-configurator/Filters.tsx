import { Dropdown, DropdownProps } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/d2-ui-components/locales";
import React from "react";
import styled from "styled-components";
import { NamedRef } from "../../../domain/common/entities/Base";

export interface ConfiguratorFiltersProps {
    values: ConfiguratorFilter;
    options: FilterOptions;
    onChange: React.Dispatch<React.SetStateAction<ConfiguratorFilter>>;
}

export interface ConfiguratorFilter {
    dataSetId: string;
}

interface FilterOptions {
    dataSets: NamedRef[];
}

export const Filters: React.FC<ConfiguratorFiltersProps> = React.memo(props => {
    const { values: filter, options: filterOptions, onChange } = props;

    const dataSetItems = useMemoOptionsFromNamedRef(filterOptions.dataSets);

    const setDataSet = React.useCallback<SingleDropdownHandler>(
        dataSetId => onChange(prev => ({ ...prev, dataSetId: dataSetId ?? "" })),
        [onChange]
    );

    return (
        <Container>
            <SingleDropdownStyled
                items={dataSetItems}
                value={filter.dataSetId}
                onChange={setDataSet}
                label={i18n.t("Data set")}
                hideEmpty
            />
        </Container>
    );
});

function useMemoOptionsFromNamedRef(options: NamedRef[]) {
    return React.useMemo(() => {
        return options.map(option => ({ value: option.id, text: option.name }));
    }, [options]);
}

const Container = styled.div`
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
`;

const SingleDropdownStyled = styled(Dropdown)`
    margin-left: -10px;
    width: 50%;
`;

type SingleDropdownHandler = DropdownProps["onChange"];
