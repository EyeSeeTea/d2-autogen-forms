import _ from "lodash";
import {
    CalculateTotalType,
    GridIndicatorsCalculatedRow,
    SubNational,
    TotalsRule,
} from "../../../data/common/Dhis2DataStoreDataForm";
import { Maybe, UnionFromValues } from "../../../utils/ts-utils";
import { Code, Id } from "./Base";
import { DataElement, dataInputPeriodsType } from "./DataElement";
import { Indicator } from "./Indicator";
import { SectionStyle } from "./SectionStyle";
import { titleVariant } from "./TitleVariant";
import { DataElementToggle } from "./ToggleMultiple";
import { DataElementRuleOptions, TotalRules } from "./DataElementRule";
import { Period, PeriodType } from "./Period";
import { RulesFormula } from "../../../data/common/RulesFormula";

export interface DataForm {
    id: Id;
    expiryDays: number;
    dataInputPeriods: dataInputPeriodsType;
    dataElements: DataElement[];
    sections: Section[];
    texts: Texts;
    options: {
        dataElements: Record<Id, { widget: "dropdown" | "radio" | "sourceType" }>;
    };
    indicators: Indicator[];
    totalRules: TotalRules;
    periodType: PeriodType;
}

export interface Texts {
    header: Maybe<string>;
    footer: Maybe<string>;
    name: Maybe<string>;
    rowTotals: Maybe<string>;
    totals: Maybe<string>;
}

export const defaultTexts: Texts = {
    header: undefined,
    footer: undefined,
    rowTotals: undefined,
    totals: undefined,
    name: undefined,
};

const viewTypes = [
    "grid",
    "table",
    "grid-with-periods",
    "grid-with-totals",
    "grid-with-combos",
    "grid-with-cat-option-combos",
    "grid-disaggregated-cocs",
    "matrix-grid",
    "grid-with-subnational-ous",
    "grid-indicators-calculated",
] as const;
export type ViewType = UnionFromValues<typeof DataFormM.viewTypes>;

export type DescriptionText = Maybe<Record<string, Maybe<string>>>;

type FormulaRules = {
    formula?: string;
    rules?: DataElementRuleOptions;
};
export type Totals = FormulaRules & {
    dataElementsCodes: string[];
    formulas: Record<string, TotalsRule> | undefined;
};

export interface SectionBase {
    id: Id;
    name: string;
    code: Code;
    dataElements: DataElement[];
    toggle:
        | { type: "none" }
        | { type: "dataElement"; dataElement: DataElement; disabled: boolean }
        | { type: "dataElementExternal"; dataElement: DataElement; condition: string; disabled: boolean }
        | { type: "orgUnit"; orgUnits: Code[]; condition: "show" | "hide"; dataElements: Code[]; disabled: boolean };
    texts: Texts;
    tabs: { active: boolean; order?: string };
    showIndex: boolean;
    sortRowsBy: string;
    titleVariant: titleVariant;
    styles: SectionStyle;
    columnsDescriptions: DescriptionText;
    groupDescriptions: DescriptionText;
    disableComments: boolean;
    disabled: boolean;
    totals?: Record<string, Totals>;
    showRowTotals: boolean;
    toggleMultiple?: DataElementToggle;
    indicators: Indicator[];
    hidden?: boolean;
    columnsConfig?: Record<string, { rules?: RulesFormula }>;
}

export interface SectionSimple extends SectionBase {
    viewType: "grid-with-combos" | "matrix-grid" | "grid-disaggregated-cocs";
}

export interface SectionWithPeriods extends SectionBase {
    viewType: "grid-with-periods" | "grid-with-cat-option-combos";
    periods: Period[];
}

export interface SectionGrid extends SectionBase {
    viewType: "table" | "grid";
    calculateTotals: CalculateTotalType;
    periods: Period[];
}

export interface SectionWithTotals extends SectionBase {
    viewType: "grid-with-totals";
    calculateTotals: CalculateTotalType;
}

export interface SectionWithSubnationals extends SectionBase {
    viewType: "grid-with-subnational-ous";
    calculateTotals: CalculateTotalType;
    subNationals: SubNational[];
}

export interface SectionWithIndicatorsCalculated extends SectionBase {
    viewType: "grid-indicators-calculated";
    periods: Period[];
    rows: GridIndicatorsCalculatedRow[];
    virtualColumns: (VirtualColumnCalculated | VirtualColumnDataElement)[];
    virtualRows: { rowConstantCode: string; dataElementCode: string; rowName: string }[];
}

export type BaseVirtualColumn = {
    dataElementCode: string;
    columnName: string;
    position: number;
};

export type VirtualColumnDataElement = BaseVirtualColumn & {
    type: "dataElement";
    dataElementRefValue: string;
};

export type VirtualColumnCalculated = BaseVirtualColumn & {
    type: "calculated";
    formula: {
        dataElementCodes: string[];
        value: string;
    };
};

export type Section =
    | SectionSimple
    | SectionGrid
    | SectionWithPeriods
    | SectionWithTotals
    | SectionWithSubnationals
    | SectionWithIndicatorsCalculated;

export class DataFormM {
    static viewTypes = viewTypes;

    static getReferencedPeriods(dataForm: DataForm, basePeriod: Id): string[] {
        return _(dataForm.sections)
            .flatMap(section => {
                switch (section.viewType) {
                    case "grid-with-periods":
                    case "grid-indicators-calculated":
                        return section.periods.map(period => period.id);
                    default:
                        return [];
                }
            })
            .uniq()
            .concat([basePeriod])
            .sortBy()
            .value();
    }
}
