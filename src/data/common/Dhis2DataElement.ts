import _ from "lodash";
import { Id } from "../../domain/common/entities/Base";
import { CategoryOptionCombo, DataElement } from "../../domain/common/entities/DataElement";
import { D2Api, MetadataPick } from "../../types/d2-api";
import { promiseMap } from "../../utils/promises";
import { Dhis2DataStoreDataForm } from "./Dhis2DataStoreDataForm";

export class Dhis2DataElement {
    constructor(private api: D2Api) {}

    async get(ids: Id[], dataSetCode: string): Promise<Record<Id, DataElement>> {
        const config = await Dhis2DataStoreDataForm.build(this.api, dataSetCode);
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
            code: true,
            categoryOptions: {
                id: true,
                code: true,
                name: true,
                displayName: true,
                displayShortName: true,
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
                name: true,
                displayName: true,
                displayFormName: true,
                displayShortName: true,
            },
        },
    },
} as const;

type D2DataElement = MetadataPick<{
    dataElements: { fields: typeof dataElementFields };
}>["dataElements"][number];

type D2DataElementTypes = D2DataElement["valueType"] | "MULTI_TEXT";

type D2DataElementNewType = Omit<D2DataElement, "valueType"> & {
    valueType: D2DataElementTypes;
};

function normalizeCategoryCombo(categoryCombo: D2DataElement["categoryCombo"]): D2DataElement["categoryCombo"] {
    const trimCategoryOption = (
        co: D2DataElement["categoryCombo"]["categories"][number]["categoryOptions"][number]
    ) => ({
        ...co,
        code: co.code.trim(),
        name: co.name.trim(),
    });

    return {
        ...categoryCombo,
        categories: categoryCombo.categories.map(category => ({
            ...category,
            categoryOptions: category.categoryOptions.map(trimCategoryOption),
        })),
        categoryOptionCombos: categoryCombo.categoryOptionCombos.map(coc => ({
            ...coc,
            name: coc.name.trim(),
            categoryOptions: coc.categoryOptions.map(trimCategoryOption),
        })),
    };
}

export function makeCocOrderArray(namesArray: string[][]): string[] {
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

// Builds a lookup `category-option code → sortOrder` from the parent
// `Category.categoryOptions` arrays. DHIS2 returns these arrays in their
// canonical sort order (set in the maintenance app), so the array index is
// the sortOrder. Used to populate `CategoryOption.sortOrder` independently of
// the (translated) display label.
function buildSortOrderByCode(
    categories: D2DataElement["categoryCombo"]["categories"]
): Record<string, number> {
    return _(categories)
        .flatMap(cat => cat.categoryOptions.map((co, index) => [co.code, index] as const))
        .fromPairs()
        .value();
}

function getCocOrdered(
    categoryCombo: D2DataElement["categoryCombo"],
    config: Dhis2DataStoreDataForm,
    sortOrderByCode: Record<string, number>
): CategoryOptionCombo[] {
    const keyName = config.categoryCombinationsConfig[categoryCombo.code]?.viewType || "formName";
    const allCategoryOptions = categoryCombo.categories.flatMap(c =>
        _(c.categoryOptions)
            .flatMap(co => {
                if (isCategoryOptionHidden(co.code, config)) return undefined;

                return {
                    name: co.name,
                    displayName: co.displayName,
                    shortName: co.displayShortName,
                    formName: co.displayFormName,
                    code: co.code,
                };
            })
            .compact()
            .value()
    );

    const categoryOptionsNamesArray = categoryCombo.categories.map(c => {
        return _(c.categoryOptions)
            .flatMap(co => {
                if (isCategoryOptionHidden(co.code, config)) return undefined;
                return co.name;
            })
            .compact()
            .value();
    });

    const cocOrderArray = makeCocOrderArray(categoryOptionsNamesArray);
    const result = cocOrderArray.flatMap(cocOrdered => {
        const match = categoryCombo.categoryOptionCombos.find(coc => {
            return coc.name === cocOrdered;
        });

        const orderedOptions = categoryCombo.categories.map(category => {
            return match?.categoryOptions.find(co => category.categoryOptions.some(catOpt => catOpt.id === co.id));
        });

        const optionsNames = orderedOptions.map(co => co?.displayName);
        const optionsShortNames = orderedOptions.map(co => co?.displayShortName);
        const optionsFormNames = orderedOptions.map(co => co?.displayFormName);

        const categoryOption =
            categoryCombo.categories.length === 1
                ? allCategoryOptions.find(c => c.name === match?.name)
                : {
                      displayName: optionsNames?.join(", "),
                      shortName: optionsShortNames?.join(", "),
                      formName: optionsFormNames?.join(", "),
                  };

        return match
            ? {
                  ...match,
                  name: categoryOption?.displayName || match.name,
                  shortName: categoryOption?.shortName,
                  formName: categoryOption?.formName,
              }
            : [];
    });

    return result.map(x => ({
        ...x,
        originalName: x.name,
        name: x[keyName] || x.name || "",
        categoryOptions: x.categoryOptions.map(co => ({
            ...co,
            originalName: co.name,
            sortOrder: sortOrderByCode[co.code] ?? Number.POSITIVE_INFINITY,
        })),
    }));
}

function isCategoryOptionHidden(code: string, config: Dhis2DataStoreDataForm) {
    return config.categoryOptionsConfig[code]?.visible === false;
}

function getVisibleCategoryOptionCombos(
    categoryOptionCombos: D2DataElement["categoryCombo"]["categoryOptionCombos"],
    config: Dhis2DataStoreDataForm,
    sortOrderByCode: Record<string, number>
): CategoryOptionCombo[] {
    const hiddenCategoryOptions = _(config.categoryOptionsConfig)
        .pickBy(value => value.visible === false)
        .keys()
        .value();

    return categoryOptionCombos
        .filter(coc => !coc.categoryOptions.some(co => hiddenCategoryOptions.includes(co.code)))
        .map((item): CategoryOptionCombo => {
            return {
                ...item,
                originalName: item.name,
                categoryOptions: item.categoryOptions.map(co => ({
                    ...co,
                    originalName: co.name,
                    sortOrder: sortOrderByCode[co.code] ?? Number.POSITIVE_INFINITY,
                })),
            };
        });
}

function getDataElement(dataElement: D2DataElementNewType, config: Dhis2DataStoreDataForm): DataElement | null {
    const { valueType } = dataElement;
    const categoryCombo = normalizeCategoryCombo(dataElement.categoryCombo);
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
    const sortOrderByCode = buildSortOrderByCode(categoryCombo.categories);
    const categoryCombination = {
        id: categoryCombo?.id,
        name: categoryCombo?.name,
        categories: categoryCombo?.categories.map(cat => {
            const keyName = config.categoryCombinationsConfig[categoryCombo.code]?.viewType || "formName";
            return {
                ...cat,
                categoryOptions: cat.categoryOptions.map((co, index) => {
                    const record = {
                        id: co.id,
                        name: co.displayName,
                        formName: co.displayFormName,
                        shortName: co.displayShortName,
                        code: co.code,
                    };
                    return {
                        id: record.id,
                        originalName: co.displayName,
                        code: co.code,
                        name: record[keyName] ?? record.name,
                        displayFormName: record.formName,
                        sortOrder: index,
                    };
                }),
            };
        }),
        categoryOptionCombos: getCocOrdered(categoryCombo, config, sortOrderByCode),
    };
    const categoryOptionCombos = getVisibleCategoryOptionCombos(
        categoryCombo.categoryOptionCombos,
        config,
        sortOrderByCode
    );

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
        deleteRules: [],
        htmlText: undefined,
        disabled: deConfig?.disabled || false,
    };

    switch (valueType) {
        case "TEXT":
            return { type: "TEXT", isLongText: false, related: undefined, ...base };
        case "LONG_TEXT":
            return { type: "TEXT", isLongText: true, related: undefined, ...base };
        case "MULTI_TEXT":
            return { type: "MULTI_TEXT", related: undefined, ...base };
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
        case "EMAIL":
            return { type: "TEXT", isLongText: false, isEmail: true, related: undefined, ...base };
        default:
            console.error(
                `Data element [name=${dataElement.displayName}, id=${dataElement.id}, valueType=${dataElement.valueType}] skipped, valueType not supported`
            );
            return null;
    }
}
