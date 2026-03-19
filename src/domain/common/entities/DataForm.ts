import _ from "lodash";
import { Maybe, UnionFromValues } from "../../../utils/ts-utils";
import { Code, Id } from "./Base";
import { DataElement, dataInputPeriodsType } from "./DataElement";
import { Indicator } from "./Indicator";
import { SectionStyle } from "./SectionStyle";
import { TitleVariant } from "./TitleVariant";
import { DataElementToggle } from "./ToggleMultiple";
import { DataElementRuleOptions, SectionRuleOptions, TotalDataElementRuleOptions, TotalRules } from "./DataElementRule";
import { CalculateTotalType, GridIndicatorsCalculatedRow } from "./AutogenConfig";
import { RulesFormula } from "../../../data/common/RulesFormula";
import { DataFormRule } from "./DataFormRule";
import { SectionRule } from "./SectionRule";
import { CompulsoryDataValue } from "./CompulsoryDataValue";
import { Period, PeriodType } from "./Period";

export interface DataForm {
    readonly id: Id;
    readonly expiryDays: number;
    readonly dataInputPeriods: dataInputPeriodsType;
    readonly dataElements: DataElement[];
    readonly sections: Section[];
    readonly texts: Texts;
    readonly options: {
        readonly dataElements: Record<Id, { readonly widget: DataElementWidget }>;
    };
    readonly indicators: Indicator[];
    readonly totalRules: TotalRules;
    readonly compulsoryDataValues: CompulsoryDataValue[];
    readonly showErrorOnCompulsory: boolean;
    readonly periodType: PeriodType;
    readonly rules: Maybe<DataFormRule[]>;
    readonly removePrefix: Maybe<string>;
    readonly customCss: Maybe<string>;
    readonly showNavigation: boolean;
}

export type Texts = {
    header: Maybe<string>;
    footer: Maybe<string>;
    name: Maybe<string>;
    rowTotals: Maybe<string>;
    totals: Maybe<string>;
};

export type SectionTexts = Texts & {
    tabLabel: Maybe<string>;
};

export const defaultTexts: SectionTexts = {
    header: undefined,
    footer: undefined,
    rowTotals: undefined,
    totals: undefined,
    name: undefined,
    tabLabel: undefined,
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
    "grid-category-columns",
] as const;
export type ViewType = UnionFromValues<typeof DataFormM.viewTypes>;

export type DescriptionText = Maybe<Record<string, Maybe<string>>>;

export type IndicatorsConfig = {
    position: "start" | "end";
    before?: { headers: string[] };
    after?: { headers: string[] };
};

type FormulaRules = {
    formula?: string;
    rules?: DataElementRuleOptions;
};

export type TotalsRule = (
    | {
          type: "sections";
          rules?: SectionRuleOptions;
      }
    | {
          type: "dataElements";
          rules?: TotalDataElementRuleOptions;
      }
) & { formula: string };

export type Totals = FormulaRules & {
    dataElementsCodes: string[];
    formulas: Record<string, TotalsRule> | undefined;
    strict?: boolean;
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
    texts: SectionTexts;
    tabs: { active: boolean; order?: string; rules?: RulesFormula };
    showIndex: boolean;
    sortRowsBy: string;
    titleVariant: TitleVariant;
    styles: SectionStyle;
    columnsDescriptions: DescriptionText;
    groupDescriptions: DescriptionText;
    disableComments: boolean;
    disabled: boolean;
    totals?: Record<string, Totals>;
    showRowTotals: boolean;
    toggleMultiple?: DataElementToggle;
    indicators: Indicator[];
    indicatorsConfig: IndicatorsConfig;
    fixedHeaders: boolean;
    enableTopScroll: boolean;
    fixedRowNames: boolean;
    hidden?: boolean;
    columnsConfig?: Record<string, { rules?: RulesFormula }>;
    rules: SectionRule[];
}

export interface SectionSimple extends SectionBase {
    viewType: "grid-with-combos" | "matrix-grid";
}

export interface SectionDisaggregatedCocs extends SectionBase {
    viewType: "grid-disaggregated-cocs";
    rowsConfig: Maybe<RowConfig>;
}

export interface SectionWithPeriods extends SectionBase {
    viewType: "grid-with-periods" | "grid-with-cat-option-combos";
    periods: Period[];
}

export interface SectionGrid extends SectionBase {
    viewType: "table" | "grid";
    enableGroups: boolean;
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    columnsConfig?: Record<string, { rules?: RulesFormula }>;
    firstColumnConfig: Maybe<{
        width: Maybe<number>;
        header: Maybe<string>;
    }>;
    periods: Period[];
}

export interface SectionWithTotals extends SectionBase {
    viewType: "grid-with-totals";
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    enableGroups: boolean;
    firstColumnConfig: Maybe<{
        width: number;
    }>;
}

export interface SectionWithSubnationals extends SectionBase {
    viewType: "grid-with-subnational-ous";
    calculateTotals: CalculateTotalType;
    subNationals: SubNational[];
}

export type SubNational = {
    id: Id;
    parentId: Id;
    name: string;
};

export interface SectionWithIndicatorsCalculated extends SectionBase {
    viewType: "grid-indicators-calculated";
    periods: Period[];
    rows: GridIndicatorsCalculatedRow[];
    virtualColumns: (VirtualColumnCalculated | VirtualColumnDataElement)[];
    virtualRows: { rowConstantCode: string; dataElementCode: string; rowName: string }[];
}

export interface SectionWithCategoryColumns extends SectionBase {
    viewType: "grid-category-columns";
    categoriesColumns: CategoryColumnConfig[];
    rowsConfig: Maybe<RowConfig>;
    singleCategoryInColumns: boolean;
    categoryOptionFilter: Maybe<CategoryOptionFilter>;
    dataElementsToExclude: DataElementsToExclude[];
}

export type DataElementsToExclude = {
    codesToExclude: Array<{ code: string }>;
    formula: { condition: string; value: string };
    dataElements: Array<{ code: string }>;
};

export type CategoryOptionFilter = {
    dataElementCode: Code;
    config: TypeCategoryOptionFilterConfig[];
};

export type TypeCategoryOptionFilterConfig = {
    code: string;
    disabled: boolean;
    showWhenValue: string[];
    children: Array<{ categoryOptionCode: string }>;
};

export type RowConfig = Record<string, RowConfigDetails>;
export type RowConfigDetails = { cellsVisible: boolean; rowName: Maybe<string>; hide?: boolean };

export type CategoryColumnConfig = { dataElementCode: Code; categoryCode: Code };

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
    | SectionDisaggregatedCocs
    | SectionGrid
    | SectionWithPeriods
    | SectionWithTotals
    | SectionWithSubnationals
    | SectionWithIndicatorsCalculated
    | SectionWithCategoryColumns;

export type ColumnOrder = Record<Code, number>;

export class DataFormM {
    static viewTypes = viewTypes;

    static getReferencedPeriods(dataForm: DataForm, basePeriod: Id): string[] {
        return _(dataForm.sections)
            .flatMap(section => {
                switch (section.viewType) {
                    case "table":
                    case "grid":
                    case "grid-with-periods":
                    case "grid-indicators-calculated":
                        return section.periods.map(period => period.id);
                    default:
                        return [];
                }
            })
            .concat([basePeriod])
            .uniq()
            .sortBy()
            .value();
    }
}

export type DataElementWidget = "dropdown" | "radio" | "sourceType" | "checkbox";
