import _ from "lodash";
import { assertUnreachable, Maybe } from "../../../utils/ts-utils";
import { Id } from "./Base";
import {
    DataElement,
    DataElementBoolean,
    DataElementDate,
    DataElementFile,
    DataElementMultiText,
    DataElementNumber,
    DataElementPercentage,
    DataElementText,
} from "./DataElement";

export interface DataValueBase {
    orgUnitId: Id;
    period: Period;
    categoryOptionComboId: Id;
    isRequired?: boolean;
    comment: string;
}

export interface DataValueBoolean extends DataValueBase {
    type: "BOOLEAN";
    isMultiple: false;
    dataElement: DataElementBoolean;
    value: Maybe<boolean>;
}

export interface DataValueNumberSingle extends DataValueBase {
    type: "NUMBER";
    isMultiple: false;
    dataElement: DataElementNumber;
    value: Maybe<string>;
}

export interface DataValueNumberMultiple extends DataValueBase {
    type: "NUMBER";
    isMultiple: true;
    dataElement: DataElementNumber;
    values: string[];
}

export interface DataValuePercentage extends DataValueBase {
    type: "PERCENTAGE";
    isMultiple: false;
    dataElement: DataElementPercentage;
    value: Maybe<string>;
}

export interface DataValueTextSingle extends DataValueBase {
    type: "TEXT";
    isMultiple: false;
    dataElement: DataElementText;
    value: Maybe<string>;
}

export interface DataValueTextMultiple extends DataValueBase {
    type: "TEXT";
    isMultiple: true;
    dataElement: DataElementText;
    values: string[];
}

export interface DataValueMultiText extends DataValueBase {
    type: "MULTI_TEXT";
    isMultiple: true;
    dataElement: DataElementMultiText;
    values: string[];
}

export interface DataValueFile extends DataValueBase {
    type: "FILE";
    isMultiple: false;
    dataElement: DataElementFile;
    file: Maybe<FileResource>;
    fileToSave?: File;
}

export interface DataValueDate extends DataValueBase {
    type: "DATE";
    dataElement: DataElementDate;
    value: Maybe<DateObj>;
    isMultiple: false;
}

export interface DateObj {
    day: number;
    month: number; // 1-12
    year: number;
}

export interface FileResource {
    id: Id;
    name: string;
    size: number;
    url: string;
}

export type DataValue =
    | DataValueBoolean
    | DataValueNumberSingle
    | DataValueNumberMultiple
    | DataValuePercentage
    | DataValueTextSingle
    | DataValueTextMultiple
    | DataValueFile
    | DataValueDate
    | DataValueMultiText;

export type DataValueLookup = Pick<DataValueBase, "orgUnitId" | "period" | "categoryOptionComboId">;

export type Period = string;

type DataValueSelector = string; // `${dataElementId.period.categoryOptionComboId}`
export type DataValueStoreD = Record<DataValueSelector, DataValue>;

export class DataValueStore {
    constructor(public store: DataValueStoreD) {}

    static from(dataValues: DataValue[]): DataValueStore {
        const store = _.keyBy(dataValues, dv =>
            this.getKey({
                dataElementId: dv.dataElement.id,
                period: dv.period,
                categoryOptionComboId: dv.categoryOptionComboId,
                orgUnit: dv.orgUnitId,
            })
        );
        return new DataValueStore(store);
    }

    set(dataValue: DataValue): DataValueStore {
        const key = DataValueStore.getKey({
            dataElementId: dataValue.dataElement.id,
            period: dataValue.period,
            categoryOptionComboId: dataValue.categoryOptionComboId,
            orgUnit: dataValue.orgUnitId,
        });
        return new DataValueStore({ ...this.store, [key]: dataValue });
    }

    get(dataElement: DataElement, base: DataValueLookup): Maybe<DataValue> {
        const key = DataValueStore.getKey({
            dataElementId: dataElement.id,
            period: base.period,
            categoryOptionComboId: dataElement.cocId ?? base.categoryOptionComboId,
            orgUnit: base.orgUnitId,
        });

        return this.store[key] || getEmpty(dataElement, base);
    }

    getOrEmpty(dataElement: DataElement, base: DataValueLookup): DataValue {
        return this.get(dataElement, base) || getEmpty(dataElement, base);
    }

    merge(dataValues: DataValue[]): DataValueStore {
        const store = _.keyBy(dataValues, dv =>
            DataValueStore.getKey({
                dataElementId: dv.dataElement.id,
                period: dv.period,
                categoryOptionComboId: dv.categoryOptionComboId,
                orgUnit: dv.orgUnitId,
            })
        );
        return new DataValueStore({ ...this.store, ...store });
    }

    static getKey(options: {
        dataElementId: Id;
        period: Period;
        categoryOptionComboId: Id;
        orgUnit: Id;
    }): DataValueSelector {
        return _([options.dataElementId, options.period, options.categoryOptionComboId, options.orgUnit])
            .compact()
            .join(".");
    }
}

export function getEmpty(dataElement: DataElement, base: DataValueLookup): DataValue {
    const { type } = dataElement;
    const fullBase: DataValueBase = { comment: "", ...base };

    switch (type) {
        case "BOOLEAN":
            return { ...fullBase, dataElement, type: "BOOLEAN", isMultiple: false, value: undefined };
        case "NUMBER":
            return dataElement.options?.isMultiple
                ? { ...fullBase, dataElement, type: "NUMBER", isMultiple: true, values: [] }
                : { ...fullBase, dataElement, type: "NUMBER", isMultiple: false, value: "" };
        case "TEXT":
            return dataElement.options?.isMultiple
                ? { ...fullBase, dataElement, type: "TEXT", isMultiple: true, values: [] }
                : { ...fullBase, dataElement, type: "TEXT", isMultiple: false, value: "" };
        case "MULTI_TEXT":
            return { ...fullBase, dataElement, type: "MULTI_TEXT", isMultiple: true, values: [] };
        case "PERCENTAGE":
            return { ...fullBase, dataElement, type: "PERCENTAGE", isMultiple: false, value: "" };
        case "FILE":
            return { ...fullBase, dataElement, type: "FILE", file: undefined, isMultiple: false };
        case "DATE":
            return { ...fullBase, dataElement, type: "DATE", value: undefined, isMultiple: false };

        default:
            assertUnreachable(type);
    }
}

export function hasComment(dataValue: Pick<DataValueBase, "comment">): boolean {
    return dataValue.comment.length > 0;
}

export const MULTI_TEXT_SEPARATOR = ",";
