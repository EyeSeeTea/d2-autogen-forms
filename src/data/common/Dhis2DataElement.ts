import _ from "lodash";
import { Id } from "../../domain/common/entities/Base";
import { DataElement } from "../../domain/common/entities/DataElement";
import { D2Api, MetadataPick } from "../../types/d2-api";
import { promiseMap } from "../../utils/promises";
import { Dhis2DataStoreDataForm } from "./Dhis2DataStoreDataForm";

export class Dhis2DataElement {
    constructor(private api: D2Api) {}

    async get(ids: Id[]): Promise<Record<Id, DataElement>> {
        const config = await Dhis2DataStoreDataForm.build(this.api);
        const idGroups = _(ids).uniq().chunk(100).value();

        const resList = await promiseMap(idGroups, idsGroup =>
            this.api.metadata
                .get({ dataElements: { fields: dataElementFields, filter: { id: { in: idsGroup } } } })
                .getData()
        );

        return _(resList)
            .flatMap(res => res.dataElements)
            .map(d2DataElement => getDataElement(d2DataElement, config))
            .compact()
            .map(dataElement => [dataElement.id, dataElement] as [Id, typeof dataElement])
            .fromPairs()
            .value();
    }
}

const dataElementFields = {
    id: true,
    code: true,
    displayName: true,
    displayDescription: true,
    displayFormName: true,
    valueType: true,
    optionSet: {
        id: true,
        options: { id: true, displayName: true, code: true },
    },
    categoryCombo: {
        id: true,
        code: true,
        name: true,
        categories: {
            id: true,
            name: true,
            categoryOptions: {
                id: true,
                code: true,
                name: true,
                shortName: true,
                displayFormName: true,
            },
        },
        categoryOptionCombos: {
            id: true,
            name: true,
            shortName: true,
            categoryOptions: {
                id: true,
                code: true,
            },
        },
    },
} as const;

type D2DataElement = MetadataPick<{
    dataElements: { fields: typeof dataElementFields };
}>["dataElements"][number];

function makeCocOrderArray(namesArray: string[][]): string[] {
    return namesArray.reduce((prev, current) => {
        return prev
            .map(prevValue => {
                return current.map(currentValue => {
                    return `${prevValue}, ${currentValue}`;
                });
            })
            .reduce((prevCombo, currentCombo) => {
                return prevCombo.concat(currentCombo);
            });
    });
}

function getCocOrdered(categoryCombo: D2DataElement["categoryCombo"], config: Dhis2DataStoreDataForm) {
    const allCategoryOptions = categoryCombo.categories
        .map(c => {
            return c.categoryOptions.flatMap(co => ({
                name: co.name,
                shortName: co.shortName,
                formName: co.displayFormName,
            }));
        })
        .flatMap(categoriesOptions => {
            return categoriesOptions.map(co => co);
        });

    const categoryOptionsNamesArray = categoryCombo.categories.map(c => {
        return c.categoryOptions.flatMap(co => co.name);
    });

    const cocOrderArray = makeCocOrderArray(categoryOptionsNamesArray);
    const result = cocOrderArray.flatMap(cocOrdered => {
        const match = categoryCombo.categoryOptionCombos.find(coc => {
            return coc.name === cocOrdered;
        });
        const categoryOption = allCategoryOptions.find(c => c.name === match?.name);
        return match ? { ...match, shortName: categoryOption?.shortName, formName: categoryOption?.formName } : [];
    });

    const keyName = config.categoryCombinationsConfig[categoryCombo.code]?.viewType || "name";
    return result.map(x => ({ ...x, name: x[keyName] || "" }));
}

function getDataElement(dataElement: D2DataElement, config: Dhis2DataStoreDataForm): DataElement | null {
    const { valueType } = dataElement;
    const deConfig = config.dataElementsConfig[dataElement.code];
    const optionSetFromDataElement = dataElement.optionSet
        ? {
              ...dataElement.optionSet,
              options: dataElement.optionSet.options.map(option => ({
                  name: option.displayName,
                  value: option.code,
              })),
          }
        : null;
    const optionSetFromCustomConfig = deConfig?.selection?.optionSet;
    const optionSet = optionSetFromCustomConfig || optionSetFromDataElement;
    const categoryCombination = {
        id: dataElement.categoryCombo?.id,
        name: dataElement.categoryCombo?.name,
        categoryOptionCombos: getCocOrdered(dataElement.categoryCombo, config),
    };
    const categoryOptionCombos = dataElement.categoryCombo.categoryOptionCombos;

    const base = {
        id: dataElement.id,
        code: dataElement.code,
        name: dataElement.displayFormName || dataElement.displayName,
        description: dataElement.displayDescription,
        categoryCombos: categoryCombination,
        categoryOptionCombos: categoryOptionCombos,
        options: optionSet
            ? { isMultiple: Boolean(deConfig?.selection?.isMultiple), items: optionSet.options }
            : undefined,
        rules: [],
        htmlText: undefined,
    };

    switch (valueType) {
        case "TEXT":
        case "LONG_TEXT":
            return { type: "TEXT", related: undefined, ...base };
        case "INTEGER":
        case "INTEGER_NEGATIVE":
        case "INTEGER_POSITIVE":
        case "INTEGER_ZERO_OR_POSITIVE":
        case "NUMBER":
            return { type: "NUMBER", numberType: valueType, related: undefined, ...base };
        case "BOOLEAN":
            return { type: "BOOLEAN", isTrueOnly: false, related: undefined, ...base };
        case "TRUE_ONLY":
            return { type: "BOOLEAN", isTrueOnly: true, related: undefined, ...base };
        case "FILE_RESOURCE":
            return { type: "FILE", related: undefined, ...base };
        case "DATE":
            return { type: "DATE", related: undefined, ...base };
        case "PERCENTAGE":
            return { type: "PERCENTAGE", numberType: "NUMBER", related: undefined, ...base };
        default:
            console.error(
                `Data element [name=${dataElement.displayName}, id=${dataElement.id}, valueType=${dataElement.valueType}] skipped, valueType not supported`
            );
            return null;
    }
}
