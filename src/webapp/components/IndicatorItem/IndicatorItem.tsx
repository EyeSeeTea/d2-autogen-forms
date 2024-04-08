import _ from "lodash";
import React from "react";
import {
    DataTableRow,
    DataTableCell,
    // @ts-ignore
} from "@dhis2/ui";

import { Indicator } from "../../../domain/common/entities/Indicator";
import { DataFormInfo } from "../../reports/autogenerated-forms/AutogeneratedForm";
import { DataValueNumberSingle, Period } from "../../../domain/common/entities/DataValue";
import { CustomInput } from "../../reports/autogenerated-forms/widgets/NumberWidget";

const INDICATOR_SEPARATOR = ".";
const FORMULA_PATTERN = /#{.+?}/g;

function calculateIndicator(indicatorId: string, formula: string): number {
    try {
        // eslint-disable-next-line
        const inputValue = new Function(`return ${formula}`).call(null);
        return Number(inputValue);
    } catch (error) {
        console.warn(`Cannot parse indicator: ${indicatorId} - ${formula}`);
        return NaN;
    }
}

function getValue(value: number): number | string {
    return Number.isNaN(value) || Number.POSITIVE_INFINITY === value ? "" : Math.round(value * 10) / 10;
}

export const IndicatorFormulaCell: React.FC<IndicatorFormulaCellProps> = React.memo(props => {
    const { indicator, dataFormInfo, period } = props;

    const formula = indicator.formula;
    const matcher = formula.match(FORMULA_PATTERN);

    const formulaWithValues = _(matcher)
        .map(match => {
            const operand = match.replace(/[#{}]/g, "");
            const dataElementId = operand.substring(0, operand.indexOf(INDICATOR_SEPARATOR));
            const cocId = operand.substring(operand.indexOf(INDICATOR_SEPARATOR) + 1, operand.length);
            const dataElement = dataFormInfo.metadata.dataForm.dataElements.find(
                dataElement => dataElement.id === dataElementId
            );
            if (!dataElement) return undefined;
            const dataValue = dataFormInfo.data.values.get(dataElement, {
                categoryOptionComboId: cocId,
                orgUnitId: dataFormInfo.orgUnitId,
                period: period,
            }) as DataValueNumberSingle;
            return { match, value: dataValue.value || "0" };
        })
        .compact()
        .value();

    const indicatorValue = formulaWithValues.reduce((acum, matchValue) => {
        const value = acum.replace(matchValue.match, matchValue.value);
        return value;
    }, formula);

    const inputValue = calculateIndicator(indicator.id, indicatorValue);
    return (
        <DataTableCell key={`${period}-${indicator.id}`}>
            <CustomInput
                key={`${indicator.id}-${period}-${inputValue}`}
                defaultValue={getValue(inputValue)}
                disabled
                readOnly
            />
        </DataTableCell>
    );
});

export const IndicatorItem: React.FC<IndicatorItemProps> = React.memo(props => {
    const { dataFormInfo, indicator, periods } = props;
    return (
        <>
            {periods.map(period => {
                return (
                    <IndicatorFormulaCell
                        key={`${period}-${indicator.id}`}
                        dataFormInfo={dataFormInfo}
                        indicator={indicator}
                        period={period}
                    />
                );
            })}
        </>
    );
});

export const RowIndicatorItem: React.FC<IndicatorRowItemProps> = React.memo(props => {
    const { colSpan, dataFormInfo, indicator, periods } = props;
    return (
        <DataTableRow>
            <DataTableCell colSpan={colSpan}>
                <span>{indicator.description}</span>
            </DataTableCell>
            <IndicatorItem key={indicator.id} indicator={indicator} dataFormInfo={dataFormInfo} periods={periods} />
        </DataTableRow>
    );
});

type IndicatorFormulaCellProps = { dataFormInfo: DataFormInfo; indicator: Indicator; period: Period };
type IndicatorItemProps = { dataFormInfo: DataFormInfo; indicator: Indicator; periods: Period[] };
type IndicatorRowItemProps = IndicatorItemProps & { colSpan: string };
