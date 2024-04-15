import _ from "lodash";

import { Code, getId, Id } from "../../domain/common/entities/Base";
import { DataElement } from "../../domain/common/entities/DataElement";
import { Rule, RuleType } from "../../domain/common/entities/DataElementRule";
import { DataForm, defaultTexts, Section, SectionBase } from "../../domain/common/entities/DataForm";
import { Period } from "../../domain/common/entities/DataValue";
import { Indicator } from "../../domain/common/entities/Indicator";
import { SectionStyle } from "../../domain/common/entities/SectionStyle";
import { buildToggleMultiple } from "../../domain/common/entities/ToggleMultiple";
import { DataFormRepository } from "../../domain/common/repositories/DataFormRepository";
import { D2Api, MetadataPick } from "../../types/d2-api";
import { Maybe } from "../../utils/ts-utils";
import { Dhis2DataElement } from "./Dhis2DataElement";
import {
    DataElementConfig,
    Dhis2DataStoreDataForm,
    IndicatorConfig,
    SectionConfig,
    SubNational,
} from "./Dhis2DataStoreDataForm";

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

        return {
            indicators: _(sections)
                .flatMap(section => section.indicators)
                .value(),
            id: dataSet.id,
            expiryDays: dataSet.expiryDays,
            dataInputPeriods: dataSet.dataInputPeriods,
            dataElements: _.flatMap(sections, section => section.dataElements),
            sections: sections,
            texts: dataSetConfig.texts,
            options: { dataElements: dataElementsOptions },
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

        const dataElements = await new Dhis2DataElement(this.api).get(dataElementIds);

        const dataElementsRulesConfig = this.buildRulesFromConfig(dataElements, configDataForm, allDataElements);
        return dataSet.sections.map((section): Section => {
            const config = dataSetConfig.sections[section.id];
            const sectionIndicators = this.buildIndicators(section.indicators);
            const base: SectionBase = {
                indicators: this.buildIndicatorsWithConfig(sectionIndicators, config?.indicators),
                id: section.id,
                name: section.displayName,
                toggle: { type: "none" },
                texts: config?.texts || defaultTexts,
                tabs: config?.tabs || { active: false },
                sortRowsBy: config?.sortRowsBy || "",
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

                        const deHideConfig = deConfig?.selection?.visible;
                        const d2DataElement = deHideConfig
                            ? section.dataElements.find(de => de.code === deHideConfig.dataElementCode)
                            : undefined;
                        const deRelated = d2DataElement ? dataElements[d2DataElement.id] : undefined;
                        return {
                            ...dataElement,
                            disabledComments: deConfig?.disableComments || false,
                            related: deRelated
                                ? { dataElement: deRelated, value: deHideConfig?.value || "" }
                                : undefined,
                            rules: dataElementRules,
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
                toggleMultiple: config?.toggleMultiple ? buildToggleMultiple(config.toggleMultiple, dataElements) : [],
            };

            if (!config) return { viewType: "table", calculateTotals: undefined, ...base };

            const base2 = getSectionBaseWithToggle(config, base, dataElements);

            switch (config.viewType) {
                case "grid-with-periods":
                    return { viewType: config.viewType, periods: config.periods, ...base2 };
                case "table":
                case "grid":
                case "grid-with-totals":
                    return { viewType: config.viewType, calculateTotals: config.calculateTotals, ...base2 };
                case "grid-with-subnational-ous":
                    return {
                        viewType: config.viewType,
                        subNationals: config?.subNationalDataset
                            ? _(configDataForm.subNationals)
                                  .filter((sn: SubNational) => sn.parentId === orgUnit)
                                  .sortBy(sn => sn.name)
                                  .value()
                            : [],
                        ...base2,
                    };

                default:
                    return { viewType: config.viewType, ...base2 };
            }
        });
    }

    private buildIndicatorsWithConfig(
        indicators: Indicator[],
        indicatorsConfig: Maybe<Record<Code, IndicatorConfig>>
    ): Indicator[] {
        if (!indicatorsConfig) return indicators;
        return _(indicators)
            .map((indicator): Indicator => {
                const config = indicatorsConfig[indicator.code];
                if (!config) return indicator;
                return {
                    ...indicator,
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

                const disabledDataElements = this.getRuleConfigByType(
                    "disabled",
                    dataElementConfig,
                    allDataElements,
                    dataElement
                );
                const visibleDataElements = this.getRuleConfigByType(
                    "visible",
                    dataElementConfig,
                    allDataElements,
                    dataElement
                );

                return [...disabledDataElements, ...visibleDataElements];
            })
            .compact()
            .value();
    }

    private getRuleConfigByType(
        ruleType: RuleType,
        dataElementConfig: DataElementConfig,
        allDataElements: BasicDataElement[],
        dataElement: DataElement
    ) {
        const currentConfig = this.getCurrentConfigByRuleType(dataElementConfig, ruleType);
        return _(currentConfig?.dataElements)
            .map((dataElementCode): Maybe<RuleConfig> => {
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

    private getConditionValue(dataElementConfig: DataElementConfig, ruleType: RuleType) {
        switch (ruleType) {
            case "disabled":
                return dataElementConfig.rules?.disabled?.condition || "";
            case "visible":
                return dataElementConfig.rules?.visible?.condition || "";
            default:
                throw Error(`Invalid rule type: ${ruleType}`);
        }
    }

    private getCurrentConfigByRuleType(dataElementConfigRules: DataElementConfig, type: RuleType) {
        switch (type) {
            case "disabled":
                return dataElementConfigRules.rules?.disabled;
            case "visible":
                return dataElementConfigRules.rules?.visible;
            default:
                return undefined;
        }
    }

    private buildIndicators(d2Indicators: D2Indicator[]): Indicator[] {
        return d2Indicators.map(d2Indicator => {
            return {
                id: d2Indicator.id,
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

function getMetadataQuery(options: { dataSetId: Id }) {
    return {
        dataSets: {
            fields: {
                id: true,
                code: true,
                expiryDays: true,
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
                    toggle: { type: "dataElement", dataElement: toggleDataElement },
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
                    },
                };
            } else {
                console.warn(`Data element for toggle not found in section: ${toggle.code}`);
                return base;
            }
        }
        default:
            return base;
    }
}

const indicatorsFields = {
    id: true,
    code: true,
    displayDescription: true,
    numerator: true,
    denominator: true,
    indicatorType: { id: true, factor: true },
} as const;
type RuleConfig = { type: RuleType; id: string; relatedDataElementId: string; value: string };
type BasicDataElement = Pick<DataElement, "id" | "code">;

type D2Indicator = {
    id: string;
    code: string;
    displayDescription: string;
    numerator: string;
    denominator: string;
    indicatorType: { id: string; factor: number };
};
