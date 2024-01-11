import _ from "lodash";
import { CalculateTotalConfig, SubNational } from "../../../data/common/Dhis2DataStoreDataForm";
import { Maybe, UnionFromValues } from "../../../utils/ts-utils";
import { Id } from "./Base";
import { DataElement, dataInputPeriodsType } from "./DataElement";
import { Period } from "./DataValue";
import { SectionStyle } from "./SectionStyle";
import { titleVariant } from "./TitleVariant";

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
}

export interface Texts {
    header: Maybe<string>;
    footer: Maybe<string>;
}

export const defaultTexts: Texts = { header: undefined, footer: undefined };

const viewTypes = [
    "grid",
    "table",
    "grid-with-periods",
    "grid-with-totals",
    "grid-with-combos",
    "grid-with-cat-option-combos",
    "grid-with-subnational-ous",
] as const;
export type ViewType = UnionFromValues<typeof DataFormM.viewTypes>;

export type CategoryDescription = Record<string, string | undefined> | undefined;

export interface SectionBase {
    id: Id;
    name: string;
    dataElements: DataElement[];
    toggle: { type: "none" } | { type: "dataElement"; dataElement: DataElement };
    texts: Texts;
    tabs: { active: boolean; order?: number };
    sortRowsBy: string;
    titleVariant: titleVariant;
    styles: SectionStyle;
    categoryDescriptions: CategoryDescription;
    disableComments: boolean;
}

export interface SectionSimple extends SectionBase {
    viewType: "table" | "grid" | "grid-with-combos" | "grid-with-cat-option-combos";
}

export interface SectionWithPeriods extends SectionBase {
    viewType: "grid-with-periods";
    periods: string[];
}

export interface SectionWithTotals extends SectionBase {
    viewType: "grid-with-totals";
    calculateTotals: Record<string, CalculateTotalConfig | undefined> | undefined;
}

export interface SectionWithSubnationals extends SectionBase {
    viewType: "grid-with-subnational-ous";
    subNationals: SubNational[];
}

export type Section = SectionSimple | SectionWithPeriods | SectionWithTotals | SectionWithSubnationals;

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
