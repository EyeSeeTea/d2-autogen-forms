import { Maybe } from "../../../utils/ts-utils";
import { Code, Id } from "./Base";
import { DeleteRule, Rule } from "./DataElementRule";

export type DataElement =
    | DataElementBoolean
    | DataElementNumber
    | DataElementText
    | DataElementPercentage
    | DataElementFile
    | DataElementDate
    | DataElementMultiText;

interface DataElementBase {
    id: Id;
    code: Code;
    name: string;
    description?: string;
    options?: Options;
    categoryCombos: CategoryCombos;
    categoryOptionCombos: CategoryOptionCombo[];
    cocId?: string;
    orgUnit?: Id;
    related: { dataElement: DataElement; value: string } | undefined;
    disabledComments?: boolean;
    rules: Rule[];
    deleteRules: DeleteRule[];
    htmlText: Maybe<string>;
    disabled: boolean;
    mirrorFrom?: Code;
}

export interface DataElementBoolean extends DataElementBase {
    type: "BOOLEAN";
    isTrueOnly: boolean;
}

export interface DataElementNumber extends DataElementBase {
    type: "NUMBER";
    numberType: NumberType;
}

export interface DataElementPercentage extends DataElementBase {
    type: "PERCENTAGE";
    numberType: NumberType;
}

export interface DataElementText extends DataElementBase {
    type: "TEXT";
    isLongText: boolean;
    isEmail?: boolean;
}

export interface DataElementMultiText extends DataElementBase {
    type: "MULTI_TEXT";
}

export interface DataElementFile extends DataElementBase {
    type: "FILE";
}

export interface DataElementDate extends DataElementBase {
    type: "DATE";
}

type Options = Maybe<{ isMultiple: boolean; items: Option<string>[] }>;

export type CategoryOption = {
    id: Id;
    originalName: string;
    name: string;
    code: Code;
    displayFormName: string;
    // DHIS2 metadata sortOrder, used to order columns/rows independently of the
    // (translated) display label. Falls back to POSITIVE_INFINITY for legacy
    // category options that pre-date sortOrder so they sort to the end.
    sortOrder: number;
};

type CategoryCombos = {
    id: Id;
    name: string;
    categories: Array<{
        id: Id;
        code: Code;
        name: string;
        categoryOptions: CategoryOption[];
    }>;
    categoryOptionCombos: CategoryOptionCombo[];
};

export type CategoryOptionCombo = {
    id: Id;
    name: string;
    shortName: Maybe<string>;
    formName?: string;
    categoryOptions: CategoryOption[];
    originalName: string;
};

type NumberType =
    | "NUMBER"
    | "INTEGER_ZERO_OR_POSITIVE"
    | "INTEGER"
    | "INTEGER_NEGATIVE"
    | "INTEGER_POSITIVE"
    | "INTEGER_ZERO_OR_POSITIVE"
    | "PERCENTAGE";

export type DataElementType = DataElement["type"];

export interface Option<Value> {
    name: string;
    value: Value;
}

export type dataInputPeriodsType = Maybe<
    Array<{
        closingDate?: string;
        openingDate?: string;
        period: {
            id: string;
        };
    }>
>;

export function getDataElementWithCode(dataElements: DataElement[], dataElementCode: string): Maybe<DataElement> {
    return dataElements.find(dataElement => dataElement.code === dataElementCode);
}
