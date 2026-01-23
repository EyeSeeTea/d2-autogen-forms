import _ from "lodash";

import { Code, getId, Id } from "../../domain/common/entities/Base";
import { CompulsoryDataValue } from "../../domain/common/entities/CompulsoryDataValue";
import { DataElement } from "../../domain/common/entities/DataElement";
import {
    ConditionRule,
    DataElementRuleOptions,
    DataElementTotalRule,
    DeleteRule,
    Rule,
    RuleType,
    SectionTotalRule,
    TotalRules,
} from "../../domain/common/entities/DataElementRule";
import { DataForm, defaultTexts, RowConfigDetails, Section, SectionBase } from "../../domain/common/entities/DataForm";
import { Indicator } from "../../domain/common/entities/Indicator";
import { SectionStyle } from "../../domain/common/entities/SectionStyle";
import { buildToggleMultiple } from "../../domain/common/entities/ToggleMultiple";
import { DataFormRepository } from "../../domain/common/repositories/DataFormRepository";
import { D2Api, MetadataPick } from "../../types/d2-api";
import { Maybe } from "../../utils/ts-utils";
import { Dhis2DataElement } from "./Dhis2DataElement";
import {
    DataElementConfig,
    DataSetConfig,
    Dhis2DataStoreDataForm,
    IndicatorConfig,
    SectionConfig,
    SubNational,
} from "./Dhis2DataStoreDataForm";
import { validatePeriodType } from "../../domain/common/entities/Period";
import { Period } from "../../domain/common/entities/DataValue";
import { getApplicableDataFormRules } from "../../domain/common/entities/DataFormRule";

export class Dhis2DataFormRepository implements DataFormRepository {
    constructor(private api: D2Api) {}

    async get(options: { id: Id; period: Period; orgUnitId: Id }): Promise<DataForm> {
        const metadata = await this.getMetadata(options);
        const dataSet = metadata.dataSets[0];
        if (!dataSet) return Promise.reject(new Error("Data set not found"));
        const config = await Dhis2DataStoreDataForm.build(this.api, dataSet.code);
        const sections = await this.getSections(dataSet, config, options.period, options.orgUnitId);
        const dataElements = _.flatMap(sections, section => section.dataElements);
        const dataElementsOptions = this.getDataElementsOptions(dataElements, config);
        const dataSetConfig = config.getDataSetConfig(dataSet, options.period);
        const totalRules = this.getTotalRules(sections, dataElements);

        return {
            indicators: _(sections)
                .flatMap(section => section.indicators)
                .value(),
            id: dataSet.id,
            expiryDays: dataSet.expiryDays,
            dataInputPeriods: dataSet.dataInputPeriods,
            dataElements: dataElements,
            sections: sections,
            texts: dataSetConfig.texts,
            options: { dataElements: dataElementsOptions },
            totalRules: totalRules,
            compulsoryDataValues: dataSet.compulsoryDataElementOperands.map(
                operand => new CompulsoryDataValue(operand.dataElement.id, operand.categoryOptionCombo.id)
            ),
            showErrorOnCompulsory: dataSet.compulsoryFieldsCompleteOnly,
            periodType: validatePeriodType(dataSet.periodType),
            rules: getApplicableDataFormRules(dataSetConfig.rules, { period: options.period }),
            removePrefix: dataSetConfig.removePrefix,
            customCss: dataSetConfig.customCss,
        };
    }

    private getDataElementsOptions(dataElements: DataElement[], config: Dhis2DataStoreDataForm) {
        const dataElementsByCode = _.keyBy(dataElements, de => de.code);
        const dataElementsOptions = _(config.dataElementsConfig)
            .toPairs()
            .map(([code, deConfig]) => {
                const dataElement = dataElementsByCode[code];
                if (!dataElement) return;
                const defaultWidget = dataElement.type === "BOOLEAN" ? "radio" : "dropdown";
                const value = { widget: deConfig.selection?.widget || defaultWidget };
                return [dataElement.id, value] as [typeof dataElement.id, typeof value];
            })
            .compact()
            .fromPairs()
            .value();
        return dataElementsOptions;
    }

    private async getMetadata(options: { id: Id }) {
        const metadataQuery = getMetadataQuery({ dataSetId: options.id });
        return this.api.metadata.get(metadataQuery).getData();
    }

    private async getSections(dataSet: D2DataSet, configDataForm: Dhis2DataStoreDataForm, period: Period, orgUnit: Id) {
        const dataSetConfig = configDataForm.getDataSetConfig(dataSet, period);
        const dataElementIds = _(dataSet.sections)
            .flatMap(section => section.dataElements)
            .map(getId)
            .value();

        const allDataElements = _(dataSet.sections)
            .flatMap(section => section.dataElements)
            .map(dataElement => ({ id: dataElement.id, code: dataElement.code }))
            .value();

        const dataElements = await new Dhis2DataElement(this.api).get(dataElementIds, dataSet.code);

        const dataElementsRulesConfig = this.buildRulesFromConfig(dataElements, configDataForm, allDataElements);
        const deleteRulesByDataElement = this.buildDeleteRulesFromConfig(dataElements, configDataForm);

        return _(dataSet.sections)
            .map((section): Section => {
                const config = dataSetConfig.sections[section.id];

                const sectionIndicators = this.buildIndicators(section.indicators);
                const base: SectionBase = {
                    indicators: this.buildIndicatorsWithConfig(dataSetConfig, sectionIndicators, config?.indicators),
                    id: section.id,
                    name: removePrefixFromName(dataSetConfig, section.displayName),
                    code: section.code,
                    toggle: { type: "none" },
                    texts: config?.texts || defaultTexts,
                    tabs:
                        config?.tabs && config.tabs.active
                            ? { active: true, order: config.tabs.order.toString(), rules: config.tabs.rules }
                            : { active: false },
                    showIndex: config?.showIndex ?? false,
                    sortRowsBy: config?.sortRowsBy || "",
                    disabled: config?.disabled || false,
                    disableComments: config?.disableComments ?? false,
                    dataElements: _(section.dataElements)
                        .map(dataElementRef => {
                            const dataElement = dataElements[dataElementRef.id];
                            if (!dataElement) return undefined;
                            const deConfig = configDataForm.dataElementsConfig[dataElementRef.code];

                            const dataElementRules = this.getDataElementRules(
                                dataElementsRulesConfig,
                                dataElement,
                                dataElements
                            );
                            const deleteRules = deleteRulesByDataElement[dataElementRef.code] ?? [];

                            const deHideConfig = deConfig?.selection?.visible;
                            const d2DataElement = deHideConfig
                                ? section.dataElements.find(de => de.code === deHideConfig.dataElementCode)
                                : undefined;
                            const deRelated = d2DataElement ? dataElements[d2DataElement.id] : undefined;
                            return {
                                ...dataElement,
                                name: removePrefixFromName(dataSetConfig, dataElement.name),
                                disabledComments: deConfig?.disableComments || false,
                                disabled: deConfig?.disabled || false,
                                related: deRelated
                                    ? { dataElement: deRelated, value: deHideConfig?.value || "" }
                                    : undefined,
                                rules: dataElementRules,
                                deleteRules: deleteRules,
                                htmlText: deConfig?.texts?.name,
                            };
                        })
                        .compact()
                        .value(),
                    titleVariant: config?.titleVariant,
                    styles: SectionStyle.buildSectionStyles(config?.styles),
                    columnsDescriptions: config?.columnsDescriptions,
                    groupDescriptions: config?.groupDescriptions,
                    totals: config?.totals,
                    showRowTotals: section.showRowTotals,
                    toggleMultiple: config?.toggleMultiple
                        ? buildToggleMultiple(config.toggleMultiple, section, dataElements)
                        : undefined,
                    fixedHeaders: config?.fixedHeaders || false,
                    enableTopScroll: config?.enableTopScroll || false,
                    fixedRowNames: config?.fixedRowNames || false,
                    columnsConfig: config?.columnsConfig,
                };

                if (!config)
                    return {
                        viewType: "table",
                        calculateTotals: undefined,
                        periods: [],
                        ...base,
                        fixedHeaders: false,
                        columnsOrder: undefined,
                        enableGroups: false,
                        fixedRowNames: false,
                        enableTopScroll: false,
                        columnsConfig: undefined,
                        firstColumnConfig: undefined,
                    };

                const base2 = getSectionBaseWithToggle(config, base, dataElements);

                switch (config.viewType) {
                    case "grid-with-cat-option-combos":
                    case "grid-with-periods":
                        return { viewType: config.viewType, periods: config.periods, ...base2 };
                    case "table":
                    case "grid":
                        return {
                            viewType: config.viewType,
                            calculateTotals: config.calculateTotals,
                            periods: config.periods,
                            columnsOrder: config.columnsOrder,
                            enableGroups: config.enableGroups || false,
                            columnsConfig: config.columnsConfig,
                            firstColumnConfig: config.firstColumnConfig,
                            ...base2,
                        };
                    case "grid-with-totals":
                        return {
                            viewType: config.viewType,
                            calculateTotals: config.calculateTotals,
                            columnsOrder: config.columnsOrder,
                            enableGroups: config.enableGroups || false,
                            columnsConfig: config.columnsConfig,
                            firstColumnConfig: config.firstColumnConfig,
                            ...base2,
                        };
                    case "grid-with-subnational-ous":
                        return {
                            viewType: config.viewType,
                            calculateTotals: config.calculateTotals,
                            subNationals: config?.subNationalDataset
                                ? _(configDataForm.subNationals)
                                      .filter((sn: SubNational) => sn.parentId === orgUnit)
                                      .sortBy(sn => sn.name)
                                      .value()
                                : [],
                            ...base2,
                        };
                    case "grid-indicators-calculated":
                        return {
                            viewType: config.viewType,
                            periods: config.periods,
                            rows: config.rows,
                            virtualColumns: config.virtualColumns.map(vc => {
                                const constant = configDataForm.constants.find(
                                    c => c.code === vc.texts?.columnNameCode
                                );
                                return { ...vc, columnName: constant?.displayDescription ?? "" };
                            }),
                            virtualRows: config.virtualRows.map(vc => {
                                const constant = configDataForm.constants.find(c => c.code === vc.rowConstantCode);
                                return { ...vc, rowName: constant?.displayDescription ?? "" };
                            }),
                            ...base2,
                        };
                    case "grid-category-columns": {
                        const rowsConfigWithTexts = _(config.rowsConfig)
                            .map((rowConfig, key): [string, RowConfigDetails] => {
                                const constant = configDataForm.constants.find(
                                    c => c.code === rowConfig.rowNameConstant
                                );

                                return [
                                    key,
                                    {
                                        cellsVisible: rowConfig.cellsVisible ?? true,
                                        rowName: constant?.displayDescription,
                                    },
                                ];
                            })
                            .fromPairs()
                            .value();

                        return {
                            ...base2,
                            viewType: config.viewType,
                            categoriesColumns: config.categoriesColumns,
                            rowsConfig: rowsConfigWithTexts ?? undefined,
                            singleCategoryInColumns: config.singleCategoryInColumns ?? false,
                            categoryOptionFilter: config.categoryOptionFilter,
                            dataElementsToExclude: config.dataElementsToExclude || [],
                        };
                    }
                    default:
                        return { viewType: config.viewType, ...base2 };
                }
            })
            .sortBy([
                section => (section.tabs.order ? parseInt(section.tabs.order?.split(".")[0] || "0") : 0),
                section => (section.tabs.order ? parseInt(section.tabs.order?.split(".")[1] || "0") : 0),
            ])
            .value();
    }

    private getTotalRules(sections: Section[], dataElements: DataElement[]): TotalRules {
        const dataElementsByCode: Record<Code, DataElement> = _(dataElements)
            .keyBy(de => de.code)
            .value();

        const dataElementTotalRules = this.getDataElementTotalRules(sections, dataElementsByCode);
        const sectionRulesFromTotals = this.getSectionTotalRules(sections, dataElementsByCode);

        return {
            dataElementTotalRules: dataElementTotalRules,
            sectionTotalRules: sectionRulesFromTotals,
        };
    }

    private getDataElementTotalRules(
        sections: Section[],
        dataElementsByCode: Record<string, DataElement>
    ): DataElementTotalRule[] {
        return sections.flatMap(section => {
            const totalsFormulas = _(section.totals)
                .values()
                .value()
                .flatMap(totals => _(totals.formulas).values().value());

            return _(totalsFormulas)
                .map(formulaRules => {
                    if (!formulaRules.type) return undefined;
                    if (!formulaRules.rules) return undefined;
                    if (formulaRules.type === "dataElements") {
                        const { rules, formula } = formulaRules;

                        const visibleTotalRule = this.getTotalRuleByRuleType(
                            "visible",
                            rules,
                            section,
                            dataElementsByCode,
                            formula
                        );
                        const disabledTotalRule = this.getTotalRuleByRuleType(
                            "disabled",
                            rules,
                            section,
                            dataElementsByCode,
                            formula
                        );
                        const enabledTotalRule = this.getTotalRuleByRuleType(
                            "enabled",
                            rules,
                            section,
                            dataElementsByCode,
                            formula
                        );

                        return visibleTotalRule || disabledTotalRule || enabledTotalRule;
                    }
                })
                .compact()
                .value();
        });
    }

    private getSectionTotalRules(
        sections: Section[],
        dataElementsByCode: Record<string, DataElement>
    ): SectionTotalRule[] {
        return sections.flatMap(section => {
            const totalsFormulas = _(section.totals)
                .values()
                .value()
                .flatMap(totals => _(totals.formulas).values().value());

            return _(totalsFormulas)
                .map(formulaRules => {
                    if (!formulaRules.type) return undefined;
                    if (!formulaRules.rules) return undefined;
                    if (formulaRules.type === "sections") {
                        const { rules, formula } = formulaRules;

                        const relatedDataElements = this.getRelatedDataElements(section, dataElementsByCode, formula);
                        const sectionIds = _(rules.sectionCodes)
                            .map(sectionCode => sections.find(section => section.code === sectionCode)?.id)
                            .compact()
                            .value();

                        return {
                            conditions: [rules.condition],
                            formula: formula,
                            relatedDataElements: relatedDataElements,
                            sections: sectionIds,
                        };
                    }
                })
                .compact()
                .value();
        });
    }

    private getTotalRuleByRuleType(
        ruleType: RuleType,
        rules: DataElementRuleOptions,
        section: Section,
        dataElements: Record<Code, DataElement>,
        formula: string
    ): Maybe<DataElementTotalRule> {
        const relatedDataElements = this.getRelatedDataElements(section, dataElements, formula);
        const rule = rules[ruleType];
        if (!rule) return undefined;

        return {
            type: ruleType,
            dataElements: this.getTotalDataElements(rule, dataElements),
            relatedDataElements: relatedDataElements,
            conditions:
                rule.type === "option" ? rule.conditions.map(condition => condition.condition) : [rule.condition],
            formula: formula,
        };
    }

    private getTotalDataElements(rule: ConditionRule, dataElements: Record<string, DataElement>): Id[] {
        const extractedDataElements =
            rule.type === "option" ? rule.conditions.flatMap(condition => condition.dataElements) : rule.dataElements;

        return _(extractedDataElements)
            .map(dataElementCode => {
                const dataElement = dataElements[dataElementCode];
                if (!dataElement) {
                    console.warn(`Data element not found for code: ${dataElementCode}`);
                    return;
                }

                return dataElement.id;
            })
            .compact()
            .uniq()
            .value();
    }

    private getRelatedDataElements(
        section: Section,
        dataElements: Record<Code, DataElement>,
        formula: string
    ): DataElement[] {
        const dataElementCodesInFormula = formula.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];

        const relatedDataElements = _(dataElementCodesInFormula)
            .map(dataElementCode => {
                const dataElement = dataElements[dataElementCode];
                const isDataElementCodeIncluded =
                    _.values(section.totals)
                        .map(sectionTotals => sectionTotals.dataElementsCodes.includes(dataElementCode))
                        .some(value => value) ?? false;

                if (!dataElement || !isDataElementCodeIncluded) return undefined;
                return dataElement;
            })
            .compact()
            .uniqBy(de => de.id)
            .value();

        return relatedDataElements;
    }

    private buildIndicatorsWithConfig(
        dataSetConfig: DataSetConfig,
        indicators: Indicator[],
        indicatorsConfig: Maybe<Record<Code, IndicatorConfig>>
    ): Indicator[] {
        if (!indicatorsConfig)
            return indicators.map(indicator => ({
                ...indicator,
                name: removePrefixFromName(dataSetConfig, indicator.name),
                description: removePrefixFromName(dataSetConfig, indicator.description),
            }));

        return _(indicators)
            .map((indicator): Indicator => {
                const config = indicatorsConfig[indicator.code];

                if (!config)
                    return {
                        ...indicator,
                        name: removePrefixFromName(dataSetConfig, indicator.name),
                        description: removePrefixFromName(dataSetConfig, indicator.description),
                    };
                return {
                    ...indicator,
                    name: removePrefixFromName(dataSetConfig, indicator.name),
                    description: removePrefixFromName(dataSetConfig, indicator.description),
                    dataElement: config.position
                        ? {
                              code: config.position.dataElement,
                              direction: config.position.direction,
                          }
                        : undefined,
                };
            })

            .value();
    }

    private getDataElementRules(
        dataElementsRulesConfig: RuleConfig[],
        dataElement: DataElement,
        dataElements: Record<string, DataElement>
    ): Rule[] {
        const rulesConfigByDataElement = dataElementsRulesConfig.filter(
            dataElementActionConfig => dataElementActionConfig.id === dataElement.id
        );

        const dataElementRules = _(rulesConfigByDataElement)
            .map((dataElementRuleConfig): Maybe<Rule> => {
                const relatedDataElement = dataElements[dataElementRuleConfig.relatedDataElementId];
                if (!relatedDataElement) return undefined;
                return { type: dataElementRuleConfig.type, relatedDataElement, condition: dataElementRuleConfig.value };
            })
            .compact()
            .value();

        return dataElementRules;
    }

    private buildRulesFromConfig(
        dataElements: Record<string, DataElement>,
        configDataForm: Dhis2DataStoreDataForm,
        allDataElements: BasicDataElement[]
    ) {
        return _(dataElements)
            .flatMap((dataElement): Maybe<RuleConfig[]> => {
                const dataElementConfig = configDataForm.dataElementsConfig[dataElement.code];
                if (!dataElementConfig) return undefined;
                if (!dataElementConfig.rules) return undefined;

                const disabledDataElements = this.getRuleConfigByType({
                    ruleType: "disabled",
                    dataElementConfig: dataElementConfig,
                    allDataElements: allDataElements,
                    dataElement: dataElement,
                });
                const visibleDataElements = this.getRuleConfigByType({
                    ruleType: "visible",
                    dataElementConfig: dataElementConfig,
                    allDataElements: allDataElements,
                    dataElement: dataElement,
                });
                const enabledDataElements = this.getRuleConfigByType({
                    ruleType: "enabled",
                    dataElementConfig: dataElementConfig,
                    allDataElements: allDataElements,
                    dataElement: dataElement,
                });

                return [...disabledDataElements, ...visibleDataElements, ...enabledDataElements];
            })
            .compact()
            .value();
    }

    private buildDeleteRulesFromConfig(
        dataElements: Record<string, DataElement>,
        configDataForm: Dhis2DataStoreDataForm
    ): Record<string, DeleteRule[]> {
        return _(dataElements)
            .map(dataElement => {
                const dataElementConfig = configDataForm.dataElementsConfig[dataElement.code];
                if (!dataElementConfig) return undefined;

                const deleteRulesConfig = dataElementConfig.rules?.delete;
                if (!deleteRulesConfig) return undefined;

                const rules: DeleteRule[] = this.buildDeleteRules(deleteRulesConfig);
                return [dataElement.code, rules] as const;
            })
            .compact()
            .fromPairs()
            .value();
    }

    private buildDeleteRules(deleteRulesConfig: ConditionRule): DeleteRule[] {
        switch (deleteRulesConfig.type) {
            case "option":
                return deleteRulesConfig.conditions.map((rule: any) => ({
                    condition: rule.condition,
                    dataElements: rule.dataElements,
                    type: "delete",
                }));
            case "single":
            case undefined:
                return [
                    {
                        condition: deleteRulesConfig.condition,
                        dataElements: deleteRulesConfig.dataElements,
                        type: "delete",
                    },
                ];
            default:
                return [];
        }
    }

    private getRuleConfigByType(options: RuleConfigParams): RuleConfig[] {
        const { ruleType, dataElementConfig, allDataElements, dataElement } = options;

        const currentConfig = this.getCurrentConfigByRuleType(dataElementConfig, ruleType);

        switch (currentConfig?.type) {
            case "option": {
                return currentConfig.conditions.flatMap(condition => {
                    return _(condition.dataElements)
                        .map(dataElementCode => {
                            const dataElementDetails = allDataElements.find(de => de.code === dataElementCode);
                            if (!dataElementDetails) return undefined;
                            return {
                                type: ruleType,
                                id: dataElementDetails.id,
                                relatedDataElementId: dataElement.id,
                                value: condition.condition,
                            };
                        })
                        .compact()
                        .value();
                });
            }
            default:
                return this.buildRuleConfigList({
                    dataElements: currentConfig?.dataElements || [],
                    ruleType: ruleType,
                    dataElementConfig: dataElementConfig,
                    allDataElements: allDataElements,
                    dataElement: dataElement,
                });
        }
    }

    private buildRuleConfigList(options: RuleConfigParams & { dataElements: string[] }): RuleConfig[] {
        const { dataElements, ruleType, dataElementConfig, allDataElements, dataElement } = options;

        return _(dataElements)
            .map(dataElementCode => {
                const dataElementDetails = allDataElements.find(de => de.code === dataElementCode);
                if (!dataElementDetails) return undefined;
                return {
                    type: ruleType,
                    id: dataElementDetails.id,
                    relatedDataElementId: dataElement.id,
                    value: this.getConditionValue(dataElementConfig, ruleType),
                };
            })
            .compact()
            .value();
    }

    private getConditionValue(dataElementConfig: DataElementConfig, ruleType: RuleType): string {
        const ruleCondition = dataElementConfig.rules?.[ruleType];

        switch (ruleCondition?.type) {
            case "option":
                return ruleCondition.conditions[0]?.condition || "";
            default:
                return ruleCondition?.condition || "";
        }
    }

    private getCurrentConfigByRuleType(
        dataElementConfigRules: DataElementConfig,
        type: RuleType
    ): Maybe<ConditionRule> {
        switch (type) {
            case "disabled":
                return dataElementConfigRules.rules?.disabled;
            case "visible":
                return dataElementConfigRules.rules?.visible;
            case "enabled":
                return dataElementConfigRules.rules?.enabled;
            default:
                return undefined;
        }
    }

    private buildIndicators(d2Indicators: D2Indicator[]): Indicator[] {
        return d2Indicators.map(d2Indicator => {
            return {
                id: d2Indicator.id,
                name: d2Indicator.displayName,
                code: d2Indicator.code,
                description: d2Indicator.displayDescription,
                formula: `((${d2Indicator.numerator})/(${d2Indicator.denominator}))*${d2Indicator.indicatorType.factor}`,
                dataElement: undefined,
            };
        });
    }
}

type Metadata = ReturnType<typeof getMetadataQuery>;
type D2DataSet = MetadataPick<Metadata>["dataSets"][number];

function removePrefixFromName(dataSetConfig: { removePrefix: Maybe<string> }, name: Maybe<string>): string {
    return dataSetConfig.removePrefix && name ? name.replace(dataSetConfig.removePrefix, "").trim() : name || "";
}

function getMetadataQuery(options: { dataSetId: Id }) {
    return {
        dataSets: {
            fields: {
                id: true,
                code: true,
                expiryDays: true,
                compulsoryFieldsCompleteOnly: true,
                compulsoryDataElementOperands: { dataElement: { id: true }, categoryOptionCombo: { id: true } },
                periodType: true,
                dataInputPeriods: {
                    closingDate: true,
                    openingDate: true,
                    period: {
                        id: true,
                    },
                },
                sections: {
                    id: true,
                    code: true,
                    displayName: true,
                    showRowTotals: true,
                    dataElements: {
                        id: true,
                        code: true,
                        categoryCombo: {
                            id: true,
                            name: true,
                            categoryOptionCombos: {
                                id: true,
                                name: true,
                                shortName: true,
                            },
                        },
                    },
                    indicators: indicatorsFields,
                },
            },
            filter: { id: { eq: options.dataSetId } },
        },
    } as const;
}

function getSectionBaseWithToggle(
    config: SectionConfig,
    base: SectionBase,
    dataElements: Record<string, DataElement>
): SectionBase {
    const { toggle } = config;

    switch (toggle.type) {
        case "dataElement": {
            const toggleDataElement = base.dataElements.find(de => de.code === toggle.code);

            if (toggleDataElement) {
                return {
                    ...base,
                    toggle: { type: "dataElement", dataElement: toggleDataElement, disabled: toggle.disabled },
                    dataElements: _.without(base.dataElements, toggleDataElement),
                };
            } else {
                console.warn(`Data element for toggle not found in section: ${toggle.code}`);
                return base;
            }
        }
        case "dataElementExternal": {
            const allDataElements = _(dataElements)
                .map(value => value)
                .value();
            const toggleDataElement = allDataElements.find(de => de.code === toggle.code);

            if (toggleDataElement) {
                return {
                    ...base,
                    toggle: {
                        type: "dataElementExternal",
                        dataElement: toggleDataElement,
                        condition: toggle.condition || "",
                        disabled: toggle.disabled,
                    },
                };
            } else {
                console.warn(`Data element for toggle not found in section: ${toggle.code}`);
                return base;
            }
        }
        case "orgUnit": {
            return {
                ...base,
                toggle: {
                    type: "orgUnit",
                    orgUnits: toggle.orgUnits,
                    condition: toggle.condition,
                    dataElements: toggle.dataElements ?? [],
                    disabled: toggle.disabled,
                },
            };
        }
        default:
            return base;
    }
}

const indicatorsFields = {
    id: true,
    code: true,
    displayName: true,
    displayDescription: true,
    numerator: true,
    denominator: true,
    indicatorType: { id: true, factor: true },
} as const;
type RuleConfig = { type: RuleType; id: string; relatedDataElementId: string; value: string };
type BasicDataElement = Pick<DataElement, "id" | "code">;

type D2Indicator = {
    id: string;
    displayName: string;
    code: string;
    displayDescription: string;
    numerator: string;
    denominator: string;
    indicatorType: { id: string; factor: number };
};

type RuleConfigParams = {
    ruleType: RuleType;
    dataElementConfig: DataElementConfig;
    allDataElements: BasicDataElement[];
    dataElement: DataElement;
};
