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
import { Period } from "./DataValue";
import { Indicator } from "./Indicator";
import { SectionStyle } from "./SectionStyle";
import { titleVariant } from "./TitleVariant";
import { DataElementToggle } from "./ToggleMultiple";
import { DataElementRuleOptions, TotalRules } from "./DataElementRule";
import { RulesFormula } from "../../../data/common/RulesFormula";
import { CompulsoryDataValue } from "./CompulsoryDataValue";

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
    compulsoryDataValues: CompulsoryDataValue[];
    showErrorOnCompulsory: boolean;
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
    "matrix-grid",
    "grid-with-subnational-ous",
    "grid-indicators-calculated",
    "grid-category-columns",
] as const;
export type ViewType = UnionFromValues<typeof DataFormM.viewTypes>;

export type DescriptionText = Maybe<Record<string, Maybe<string>>>;

type FormulaRules = { formula?: string; rules?: DataElementRuleOptions };
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
        | { type: "dataElement"; dataElement: DataElement }
        | { type: "dataElementExternal"; dataElement: DataElement; condition: string };
    texts: Texts;
    tabs: { active: boolean; order?: string; rules?: RulesFormula };
    sortRowsBy: string;
    titleVariant: titleVariant;
    styles: SectionStyle;
    columnsDescriptions: DescriptionText;
    groupDescriptions: DescriptionText;
    disableComments: boolean;
    totals?: Record<string, Totals>;
    showRowTotals: boolean;
    toggleMultiple?: DataElementToggle;
    indicators: Indicator[];
    fixedHeaders: boolean;
    enableTopScroll: boolean;
    fixedRowNames: boolean;
}

export interface SectionSimple extends SectionBase {
    viewType: "grid-with-combos" | "grid-with-cat-option-combos" | "matrix-grid";
}

export interface SectionWithPeriods extends SectionBase {
    viewType: "grid-with-periods";
    periods: string[];
}

export interface SectionGrid extends SectionBase {
    viewType: "table" | "grid";
    enableGroups: boolean;
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    columnsConfig?: Record<string, { rules?: RulesFormula }>;
    firstColumnConfig: Maybe<{
        width: number;
    }>;
}

export interface SectionWithTotals extends SectionBase {
    viewType: "grid-with-totals";
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
}

export interface SectionWithSubnationals extends SectionBase {
    viewType: "grid-with-subnational-ous";
    calculateTotals: CalculateTotalType;
    subNationals: SubNational[];
}

export interface SectionWithIndicatorsCalculated extends SectionBase {
    viewType: "grid-indicators-calculated";
    periods: string[];
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
}

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
export type RowConfigDetails = { cellsVisible: boolean; rowName: Maybe<string> };

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
    | SectionGrid
    | SectionWithPeriods
    | SectionWithTotals
    | SectionWithSubnationals
    | SectionWithIndicatorsCalculated
    | SectionWithCategoryColumns;

export type ColumnOrder = Record<Code, number>;

export class DataFormM {
    static viewTypes = viewTypes;

    static getReferencedPeriods(dataForm: DataForm, basePeriod: Period): Period[] {
        return _(dataForm.sections)
            .flatMap(section => {
                switch (section.viewType) {
                    case "grid-with-periods":
                        return section.periods;
                    case "grid-indicators-calculated":
                        return section.periods;
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
