import _ from "lodash";
import { CalculateTotalType, SubNational } from "../../../data/common/Dhis2DataStoreDataForm";
import { Maybe, UnionFromValues } from "../../../utils/ts-utils";
import { Id } from "./Base";
import { DataElement, dataInputPeriodsType } from "./DataElement";
import { Period } from "./DataValue";
import { Indicator } from "./Indicator";
import { SectionStyle } from "./SectionStyle";
import { titleVariant } from "./TitleVariant";
import { DataElementToggle } from "./ToggleMultiple";

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
] as const;
export type ViewType = UnionFromValues<typeof DataFormM.viewTypes>;

export type DescriptionText = Maybe<Record<string, Maybe<string>>>;

export interface SectionBase {
    id: Id;
    name: string;
    dataElements: DataElement[];
    toggle:
        | { type: "none" }
        | { type: "dataElement"; dataElement: DataElement }
        | { type: "dataElementExternal"; dataElement: DataElement; condition: string };
    texts: Texts;
    tabs: { active: boolean; order?: number };
    sortRowsBy: string;
    titleVariant: titleVariant;
    styles: SectionStyle;
    columnsDescriptions: DescriptionText;
    groupDescriptions: DescriptionText;
    disableComments: boolean;
    totals?: {
        dataElementsCodes: string[];
        formula: string;
        formulas: Record<string, { formula: string }> | undefined;
    };
    showRowTotals: boolean;
    toggleMultiple: DataElementToggle[];
    indicators: Indicator[];
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
    calculateTotals: CalculateTotalType;
}

export interface SectionWithTotals extends SectionBase {
    viewType: "grid-with-totals";
    calculateTotals: CalculateTotalType;
}

export interface SectionWithSubnationals extends SectionBase {
    viewType: "grid-with-subnational-ous";
    subNationals: SubNational[];
}

export type Section = SectionSimple | SectionGrid | SectionWithPeriods | SectionWithTotals | SectionWithSubnationals;

export class DataFormM {
    static viewTypes = viewTypes;

    static getReferencedPeriods(dataForm: DataForm, basePeriod: Period): Period[] {
        return _(dataForm.sections)
            .flatMap(section => {
                switch (section.viewType) {
                    case "grid-with-periods":
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
