import { FromRulesFormulaCodec } from "../../../data/common/RulesFormula";
import { Maybe } from "../../../utils/ts-utils";
import { Code, Id, NamedRef } from "./Base";
import { Option } from "./DataElement";
import { ConditionRule, RuleType } from "./DataElementRule";
import {
    CategoryColumnConfig,
    CategoryOptionFilter,
    ColumnOrder,
    DataElementsToExclude,
    DataElementWidget,
    DescriptionText,
    SectionTexts,
    Texts,
    Totals,
} from "./DataForm";
import { DataFormRule } from "./DataFormRule";
import { Period } from "./Period";
import { SectionStyleAttrs } from "./SectionStyle";
import { TitleVariant } from "./TitleVariant";
import { ToggleMultiple } from "./ToggleMultiple";

export type AutogenConfig = {
    categoryCombinations?: Record<Code, CategoryCombinationConfig>;
    categoryOptions?: Record<Code, CategoryOptionConfig>;
    dataElements?: Record<Code, DataElementConfig>;
    dataSets: Record<Code, DataSetConfig | {}>;
};

export type DataSetConfig = {
    removePrefix: Maybe<string>;
    texts: Texts;
    sections: Record<Id, SectionConfig>;
    rules: Maybe<DataFormRule[]>;
};

type DataElementRule = Record<RuleType | "delete", ConditionRule>;

export type DataElementConfig = {
    rules?: DataElementRule;
    disabled?: boolean;
    disableComments?: boolean;
    texts?: Texts;
    selection?: {
        optionSet?: OptionSet;
        isMultiple: boolean;
        widget: Maybe<DataElementWidget>;
        visible: { dataElementCode: string; value: string } | undefined;
    };
};

export type CategoryCombinationConfig = {
    viewType: Maybe<"name" | "shortName" | "formName">;
};

export type CategoryOptionConfig = {
    visible: Maybe<boolean>;
};

export type SectionConfig =
    | BasicSectionConfig
    | GridSectionConfig
    | GridWithPeriodsSectionConfig
    | GridWithTotalsSectionConfig
    | GridWithSubnationalSectionConfig
    | GridIndicatorsCalculated
    | GridCategoryColumnsConfig;

export type SectionTotals = Totals & {
    texts?: { name?: string; code?: string };
};

export type TotalsConfig = SectionTotals | Record<string, SectionTotals>;

export type IndicatorConfig = { position: Maybe<{ dataElement: string; direction: "after" | "before" }> };

type DataElementToggle = {
    type: "dataElement";
    code: Code;
    disabled: boolean;
};

type DataElementExternalToggle = {
    type: "dataElementExternal";
    code: Code;
    condition: string | undefined;
    disabled: boolean;
};

export type OrgUnitToggle = {
    type: "orgUnit";
    orgUnits: string[];
    dataElements: string[];
    condition: "show" | "hide";
    disabled: boolean;
};

export type Toggle = DataElementToggle | DataElementExternalToggle | OrgUnitToggle | { type: "none" };

export type BaseSectionConfig = {
    texts: SectionTexts;
    toggle: Toggle;
    tabs: { active: true; order: string | number; rules?: FromRulesFormulaCodec } | { active: false };
    showIndex: boolean;
    sortRowsBy: string;
    titleVariant: TitleVariant;
    styles: SectionStyleAttrs;
    columnsDescriptions: DescriptionText;
    groupDescriptions: DescriptionText;
    disableComments: boolean;
    totals?: Record<string, SectionTotals>;
    toggleMultiple: Maybe<ToggleMultiple>;
    indicators?: Record<Code, IndicatorConfig>;
    fixedHeaders: boolean;
    fixedRowNames: boolean;
    enableTopScroll: boolean;
    columnsConfig?: GridColumnsConfig;
    disabled: boolean;
};

type BasicSectionConfig = BaseSectionConfig & {
    viewType: "grid-with-combos" | "matrix-grid" | "grid-disaggregated-cocs";
    columnsConfig?: Record<string, { rules?: FromRulesFormulaCodec }>;
};

type GridSectionConfig = BaseSectionConfig & {
    viewType: "table" | "grid";
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    enableGroups: boolean;
    columnsConfig?: Record<
        string,
        {
            rules?: FromRulesFormulaCodec;
        }
    >;
    firstColumnConfig?: {
        width: number;
    };
    periods: Period[];
};

type GridWithPeriodsSectionConfig = BaseSectionConfig & {
    viewType: "grid-with-periods" | "grid-with-cat-option-combos";
    periods: Period[];
};

type GridWithTotalsSectionConfig = BaseSectionConfig & {
    viewType: "grid-with-totals";
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    fixedRowNames: boolean;
    enableGroups: boolean;
    enableTopScroll: boolean;
    columnsConfig?: GridColumnsConfig;
    firstColumnConfig?: {
        width: number;
    };
};

type GridIndicatorsCalculated = BaseSectionConfig & {
    viewType: "grid-indicators-calculated";
    periods: Period[];
    rows: GridIndicatorsCalculatedRow[];
    virtualRows: VirtualRow[];
    virtualColumns: (VirtualColumnDataElement | VirtualColumnCalculated)[];
};

type GridColumnsConfig = Record<string, { rules?: FromRulesFormulaCodec }>;

type GridCategoryColumnsConfig = BaseSectionConfig & {
    viewType: "grid-category-columns";
    categoriesColumns: CategoryColumnConfig[];
    rowsConfig: Maybe<Record<string, { cellsVisible?: boolean; rowNameConstant?: string }>>;
    singleCategoryInColumns: boolean;
    categoryOptionFilter: Maybe<CategoryOptionFilter>;
    dataElementsToExclude: Maybe<DataElementsToExclude[]>;
};

type VirtualRow = {
    rowConstantCode: string;
    dataElementCode: string;
};

export type GridIndicatorsCalculatedRow = {
    code: Code;
    denominator: Maybe<{ text: { code: Code }; dataElementCode: Code }>;
    value: Maybe<{
        dataElementCodes: Code[];
        formula: { value: string };
    }>;
};

type GridWithSubnationalSectionConfig = BaseSectionConfig & {
    viewType: "grid-with-subnational-ous";
    calculateTotals: CalculateTotalType;
    subNationalDataset: string;
};

type CalculateTotalConfig = {
    totalDeCode: Code | undefined;
    disabled: boolean | undefined;
};

export type CalculateTotalType = Record<string, CalculateTotalConfig | undefined> | undefined;

type D2BaseVirtualColumn = {
    dataElementCode: string;
    position: number;
    texts?: {
        columnNameCode: string;
    };
};

type VirtualColumnDataElement = D2BaseVirtualColumn & {
    type: "dataElement";
    dataElementRefValue: string;
};

type VirtualColumnCalculated = D2BaseVirtualColumn & {
    type: "calculated";
    formula: {
        dataElementCodes: string[];
        value: string;
    };
};

export type OptionSet = NamedRef & {
    code: string;
    options: Option<string>[];
};
