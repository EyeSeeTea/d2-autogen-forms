import { Maybe } from "../../../utils/ts-utils";
import { Code, Id, NamedRef } from "./Base";
import { Option } from "./DataElement";
import { DataElementRuleOptions } from "./DataElementRule";
import { DescriptionText, Texts, Totals } from "./DataForm";
import { SectionStyleAttrs } from "./SectionStyle";
import { TitleVariant } from "./TitleVariant";
import { ToggleMultiple } from "./ToggleMultiple";

export type AutogenConfig = {
    categoryCombinations: Record<Code, CategoryCombinationConfig>;
    categoryOptions: Record<Code, CategoryOptionConfig>;
    dataElements: Record<Code, DataElementConfig>;
    dataSets: Record<Code, DataSetConfig>;
};

export type DataSetConfig = {
    texts: Texts;
    sections: Record<Id, SectionConfig>;
};

export type DataElementConfig = {
    rules?: DataElementRuleOptions;
    disableComments?: boolean;
    texts?: Texts;
    selection?: {
        optionSet?: OptionSet;
        isMultiple: boolean;
        widget: Maybe<"dropdown" | "radio" | "sourceType">;
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
    | GridIndicatorsCalculated;

export type SectionTotals = Totals & {
    texts?: { name?: string; code?: string };
};

export type TotalsConfig = SectionTotals | Record<string, SectionTotals>;

export type IndicatorConfig = { position: Maybe<{ dataElement: string; direction: "after" | "before" }> };

export type BaseSectionConfig = {
    texts: Texts;
    toggle:
        | { type: "none" }
        | { type: "dataElement"; code: Code }
        | { type: "dataElementExternal"; code: Code; condition: string | undefined };
    tabs: { active: true; order: string | number } | { active: false };
    sortRowsBy: string;
    titleVariant: TitleVariant;
    styles: SectionStyleAttrs;
    columnsDescriptions: DescriptionText;
    groupDescriptions: DescriptionText;
    disableComments: boolean;
    totals?: Record<string, SectionTotals>;
    toggleMultiple: Maybe<ToggleMultiple>;
    indicators?: Record<Code, IndicatorConfig>;
};

type BasicSectionConfig = BaseSectionConfig & {
    viewType: "grid-with-combos" | "grid-with-cat-option-combos" | "matrix-grid" | "grid-disaggregated-cocs";
};

type GridSectionConfig = BaseSectionConfig & {
    viewType: "table" | "grid";
    calculateTotals: CalculateTotalType;
};

type GridWithPeriodsSectionConfig = BaseSectionConfig & {
    viewType: "grid-with-periods";
    periods: string[];
};

type GridWithTotalsSectionConfig = BaseSectionConfig & {
    viewType: "grid-with-totals";
    calculateTotals: CalculateTotalType;
};

type GridIndicatorsCalculated = BaseSectionConfig & {
    viewType: "grid-indicators-calculated";
    periods: string[];
    rows: GridIndicatorsCalculatedRow[];
    virtualRows: VirtualRow[];
    virtualColumns: (VirtualColumnDataElement | VirtualColumnCalculated)[];
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
