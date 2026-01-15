import _ from "lodash";
import { Section, SectionWithCategoryColumns } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";
import { makeCocOrderArray } from "../../../data/common/Dhis2DataElement";
import { Maybe } from "../../../utils/ts-utils";

export interface Grid {
    id: string;
    name: string;
    columns: Column[];
    rows: Row[];
    toggle: Section["toggle"];
    toggleMultiple: Section["toggleMultiple"];
    useIndexes: boolean;
    texts: Section["texts"];
    parentColumns: ParentColumn[];
    hidden: boolean;
}

interface Column {
    name: string;
    code: string;
    categories?: string[];
    totalCategories: number;
    parentColumnName?: string;
}

interface Row {
    id: string;
    name: string;
    cellsVisible: boolean;
    items: Array<{
        disabled: boolean;
        dataElement: Maybe<DataElement>;
        columnTotal?: DataElement;
        columnDataElements: Maybe<DataElement[]>;
    }>;
}

type ParentColumn = {
    name: string;
    colSpan: number;
};

const separator = " - ";

export type TypeCategoryOptionFilterConfig = {
    code: string;
    name?: string;
    disabled: boolean;
    showWhenValue: Maybe<string>[];
    children: Array<{ categoryOptionCode: string }>;
};

export class GridWithCategoryColumnsViewModel {
    static get(
        section: SectionWithCategoryColumns,
        filterValue: Maybe<string>,
        categoryOptionValues: TypeCategoryOptionFilterConfig[],
        dataElementCodesToExclude: string[]
    ): Grid {
        const dataElementsCodeToShowSet = new Set(dataElementCodesToExclude);
        const dataElementsToShow =
            dataElementsCodeToShowSet.size > 0
                ? section.dataElements.filter(de => dataElementsCodeToShowSet.has(de.code))
                : section.dataElements;

        const { parentColumns, columns } = this.getColumns({ ...section, dataElements: dataElementsToShow });

        const rows = this.buildRows(
            { ...section, dataElements: dataElementsToShow },
            categoryOptionValues,
            filterValue
        );

        return {
            id: section.id,
            name: section.name,
            columns: columns,
            rows: rows,
            toggle: section.toggle,
            texts: section.texts,
            useIndexes: false,
            parentColumns: parentColumns,
            toggleMultiple: section.toggleMultiple,
            hidden: section.hidden || false,
        };
    }

    private static getColumns(section: SectionWithCategoryColumns): {
        columns: Column[];
        parentColumns: ParentColumn[];
    } {
        const { categoriesColumns, dataElements, singleCategoryInColumns } = section;
        const columns = dataElements.map((dataElement): Column => {
            const category = this.getCategoryColumn(dataElement, categoriesColumns);

            const columnName = _(dataElement.name).split(separator).last() || "";
            const parentColumnName = _(dataElement.name).split(separator).first() || "";

            return {
                name: columnName,
                code: singleCategoryInColumns
                    ? dataElement.code
                    : `${dataElement.code}-${category?.categoryOptions.join("-")}`,
                parentColumnName: parentColumnName,
                categories: singleCategoryInColumns ? [] : category?.categoryOptions.map(c => c.name) ?? [],
                totalCategories: singleCategoryInColumns ? 0 : category?.categoryOptions.length || 0,
            };
        });

        const parentColumns = _(columns)
            .groupBy(column => column.parentColumnName)
            .map((group, name) => {
                return {
                    name: name,
                    colSpan: _.sumBy(group, c => c.totalCategories || 1),
                };
            })
            .value();

        return { columns: columns, parentColumns: parentColumns };
    }

    private static buildRows(
        section: SectionWithCategoryColumns,
        categoryOptionValues: TypeCategoryOptionFilterConfig[],
        filterValue: Maybe<string>
    ): Row[] {
        const { dataElements, categoriesColumns } = section;
        const categoriesToShow = categoryOptionValues.filter(c => c.showWhenValue.includes(filterValue));
        const items = dataElements.flatMap(dataElement => {
            const multipleCombinationsInRow = dataElement.categoryCombos.categories.length > 2;

            const categoryOptionsToShow = categoriesToShow.flatMap(c =>
                [c.code].concat(c.children.map(child => child.categoryOptionCode))
            );

            const catOptionsToShowSet = new Set(categoryOptionsToShow);
            const applyFilter = categoryOptionsToShow.length > 0;

            if (dataElement.categoryCombos.categories.length === 1) {
                return this.buildItemsForOneCategory(
                    dataElement,
                    section.singleCategoryInColumns,
                    catOptionsToShowSet,
                    applyFilter
                );
            }

            const allOptions = _(dataElement.categoryCombos.categories)
                .flatMap(c => c.categoryOptions.flatMap(co => co))
                .keyBy(x => x.code)
                .value();

            const category = this.getCategoryColumn(dataElement, categoriesColumns);

            const columnOptions = category?.categoryOptions.map(co => co.code) ?? [];

            const restCategories = _(dataElement.categoryCombos.categories)
                .filter(c => c.code !== category?.code)
                .value();

            const restCategoryOptions = restCategories.map(c => c.categoryOptions.flatMap(co => co.code));
            const combinations = restCategoryOptions.length > 0 ? makeCocOrderArray(restCategoryOptions) : [];
            if (combinations.length === 0) return [];

            const dataElementsWithCocId = columnOptions.flatMap(columnOption => {
                const columnOptionCode = allOptions[columnOption]?.code;

                return _(combinations)
                    .map(combination => {
                        const combinationOptionCode = multipleCombinationsInRow
                            ? combination.split(", ").map(co => allOptions[co]?.code) ?? []
                            : [allOptions[combination]?.code];

                        if (applyFilter && !catOptionsToShowSet.has(combinationOptionCode[0] ?? "")) return undefined;

                        const cocOriginalName = [columnOption].concat(combination).join(", ");
                        const cocDetails = this.findCombinationByOptionCodes(
                            dataElement,
                            _([columnOptionCode, ...combinationOptionCode])
                                .compact()
                                .value()
                        );

                        if (!cocDetails) {
                            console.warn(
                                `Category option combo with name ${cocOriginalName} not found for data element ${dataElement.name}`
                            );
                        }

                        const cocName = multipleCombinationsInRow
                            ? combination
                                  .split(", ")
                                  .map(co => allOptions[co]?.name)
                                  .join(", ")
                            : allOptions[combination]?.name ?? "";

                        return {
                            ...dataElement,
                            cocId: cocDetails?.id,
                            fullName: dataElement.name,
                            cocName: cocName,
                            groupRowId: combination,
                            disabled: !cocDetails,
                            cocCodes: _([columnOptionCode, ...combinationOptionCode])
                                .compact()
                                .value(),
                        };
                    })
                    .compact()
                    .value();
            });
            return dataElementsWithCocId;
        });

        return _(items)
            .groupBy(item => item.groupRowId)
            .map((group): Row => {
                const id = _(group)
                    .flatMap(x => x.cocCodes)
                    .uniq()
                    .join("-");

                const name = group[0].cocName ?? "";

                const rowConfig = section.rowsConfig?.[id];

                return {
                    id: id,
                    name: rowConfig?.rowName ?? name,
                    cellsVisible: rowConfig?.cellsVisible ?? true,
                    items: group.map((de): Row["items"][number] => {
                        const columnOptionCode = _(de.cocCodes).first();
                        const parentCode = _(de.cocCodes).last();

                        const configuration = this.buildConfigurationForDataElement(parentCode, categoryOptionValues);

                        if (!configuration?.value) {
                            return {
                                disabled: de.disabled,
                                dataElement: de,
                                columnDataElements: undefined,
                                columnTotal: undefined,
                            };
                        }

                        const isParent = configuration?.typeConfig === "parent";
                        const isChildren =
                            configuration?.typeConfig === "children" && configuration.value.children.length > 0;

                        const parentCombinationCombo2 = isChildren
                            ? this.findCombinationByOptionCodes(
                                  de,
                                  _([columnOptionCode, configuration.value.code]).compact().uniq().value()
                              )
                            : undefined;

                        const columnDataElements2 = isChildren
                            ? _(configuration.value.children)
                                  .map(childrenCode => {
                                      const codes = section.singleCategoryInColumns
                                          ? [childrenCode.categoryOptionCode]
                                          : _([columnOptionCode, childrenCode.categoryOptionCode])
                                                .compact()
                                                .uniq()
                                                .value();

                                      const combination = this.findCombinationByOptionCodes(de, codes);
                                      if (!combination) return undefined;

                                      return { ...de, cocId: combination.id };
                                  })
                                  .compact()
                                  .value()
                            : undefined;

                        return {
                            disabled: de.disabled || isParent ? Boolean(configuration?.value.disabled) : false,
                            dataElement: de,
                            columnTotal: parentCombinationCombo2
                                ? { ...de, cocId: parentCombinationCombo2.id }
                                : undefined,
                            columnDataElements: columnDataElements2,
                        };
                    }),
                };
            })
            .value();
    }

    private static buildConfigurationForDataElement(
        parentCode: Maybe<string>,
        config: TypeCategoryOptionFilterConfig[]
    ): Maybe<{ typeConfig: "children" | "parent"; value: Maybe<TypeCategoryOptionFilterConfig> }> {
        if (!parentCode) return undefined;

        const parentConfiguration = config.find(c => c.code === parentCode);
        const childrenConfiguration = config.find(c =>
            c.children.some(child => child.categoryOptionCode === parentCode)
        );

        return {
            typeConfig: parentConfiguration ? "parent" : "children",
            value: parentConfiguration || childrenConfiguration,
        };
    }

    private static buildItemsForOneCategory(
        dataElement: DataElement,
        inRows: boolean,
        catOptionsToShowSet: Set<string>,
        applyFilter: boolean
    ) {
        const allOptions = dataElement.categoryCombos.categories.flatMap(c => c.categoryOptions.flatMap(co => co));

        return _(allOptions)
            .map(coc => {
                if (applyFilter && !catOptionsToShowSet.has(coc.code ?? "")) return undefined;
                const combinationId = this.findCombinationByOptionCodes(dataElement, [coc.code])?.id;
                return {
                    ...dataElement,
                    cocId: combinationId,
                    fullName: dataElement.name,
                    cocName: inRows ? coc.name : "",
                    disabled: !combinationId,
                    groupRowId: inRows ? `${coc.name}${cocNameIdSeparator}${coc.id}` : "",
                    cocCodes: [coc.code],
                };
            })
            .compact()
            .value();
    }

    private static getCategoryColumn(
        dataElement: DataElement,
        categoriesColumnsConfig: SectionWithCategoryColumns["categoriesColumns"]
    ) {
        const categoryColumnConfig = categoriesColumnsConfig.find(
            config => config.dataElementCode === dataElement.code
        );

        return (
            dataElement.categoryCombos.categories.find(
                category => category.code === categoryColumnConfig?.categoryCode
            ) ?? dataElement.categoryCombos.categories[0]
        );
    }

    private static findCombinationByOptionCodes(dataElement: DataElement, optionCodes: string[]) {
        const categories = dataElement.categoryCombos.categories;

        const codeSet = new Set(optionCodes.map(c => c));

        const selectedOptionNames = _(categories)
            .map(cat => cat.categoryOptions.find(categoryOption => codeSet.has(categoryOption.code))?.originalName)
            .compact()
            .value();

        if (selectedOptionNames.length !== categories.length) {
            return undefined;
        }

        const expectedName = selectedOptionNames.join(", ");

        const match = dataElement.categoryCombos.categoryOptionCombos.find(coc => coc.originalName === expectedName);

        return match ? { id: match.id, name: match.name } : undefined;
    }
}

const cocNameIdSeparator = "|_|";
