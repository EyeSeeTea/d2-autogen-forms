import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.34";
import { boolean, Codec, exactly, GetType, oneOf, optional, record, string, number, array } from "purify-ts";
import { Namespaces } from "./clients/storage/Namespaces";
import { Maybe, NonPartial } from "../../utils/ts-utils";
import { Code, getCode, Id, NamedRef } from "../../domain/common/entities/Base";
import { Option } from "../../domain/common/entities/DataElement";
import { Period } from "../../domain/common/entities/DataValue";
import { ColumnOrder, DescriptionText, Texts, Totals } from "../../domain/common/entities/DataForm";
import { titleVariant } from "../../domain/common/entities/TitleVariant";
import { SectionStyle, SectionStyleAttrs } from "../../domain/common/entities/SectionStyle";
import { DataElementRuleOptions, SectionRuleOptions } from "../../domain/common/entities/DataElementRule";
import { ToggleMultiple } from "../../domain/common/entities/ToggleMultiple";
import { FromRulesFormulaCodec, rulesFormulaCodec } from "./RulesFormula";

interface DataSetConfig {
    texts: Texts;
    sections: Record<Id, SectionConfig>;
}

export type SectionConfig =
    | BasicSectionConfig
    | GridSectionConfig
    | GridWithPeriodsSectionConfig
    | GridWithTotalsSectionConfig
    | GridWithSubnationalSectionConfig
    | GridIndicatorsCalculated;

export type TotalsRule = (
    | {
          type: "sections";
          rules?: SectionRuleOptions;
      }
    | {
          type: "dataElements";
          rules?: DataElementRuleOptions;
      }
) & { formula: string };

type SectionTotals = Totals & {
    texts?: { name?: string; code?: string };
};

type TotalsConfig = SectionTotals | Record<string, SectionTotals>;

interface BaseSectionConfig {
    texts: Texts;
    toggle:
        | { type: "none" }
        | { type: "dataElement"; code: Code }
        | { type: "dataElementExternal"; code: Code; condition: string | undefined };
    tabs: { active: true; order: string | number; rules?: FromRulesFormulaCodec } | { active: false };
    sortRowsBy: string;
    titleVariant: titleVariant;
    styles: SectionStyleAttrs;
    columnsDescriptions: DescriptionText;
    groupDescriptions: DescriptionText;
    disableComments: boolean;
    totals?: Record<string, SectionTotals>;
    toggleMultiple: Maybe<ToggleMultiple>;
    indicators?: Record<Code, IndicatorConfig>;
    fixedHeaders: boolean;
}

interface BasicSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-combos" | "grid-with-cat-option-combos" | "matrix-grid";
}

interface GridSectionConfig extends BaseSectionConfig {
    viewType: "table" | "grid";
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    fixedRowNames: boolean;
    enableGroups: boolean;
    enableTopScroll: boolean;
    columnsConfig?: Record<
        string,
        {
            rules?: FromRulesFormulaCodec;
        }
    >;
}

interface GridWithPeriodsSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-periods";
    periods: string[];
}

interface GridWithTotalsSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-totals";
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    fixedRowNames: boolean;
    enableGroups: boolean;
    enableTopScroll: boolean;
    columnsConfig?: GridColumnsConfig;
}

interface GridIndicatorsCalculated extends BaseSectionConfig {
    viewType: "grid-indicators-calculated";
    periods: string[];
    rows: GridIndicatorsCalculatedRow[];
    virtualRows: VirtualRow[];
    virtualColumns: (VirtualColumnDataElement | VirtualColumnCalculated)[];
}

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

type GridColumnsConfig = Record<string, { rules?: FromRulesFormulaCodec }>;

interface GridWithSubnationalSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-subnational-ous";
    calculateTotals: CalculateTotalType;
    subNationalDataset: string;
}

export type CalculateTotalConfig = {
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

const defaultViewType = "table";

const selector = Codec.interface({ code: string });

const viewType = oneOf([
    exactly("table"),
    exactly("grid"),
    exactly("grid-with-totals"),
    exactly("grid-with-combos"),
    exactly("grid-with-cat-option-combos"),
    exactly("matrix-grid"),
    exactly("grid-with-periods"),
    exactly("grid-with-subnational-ous"),
    exactly("grid-indicators-calculated"),
]);

const titleVariantType = oneOf([
    exactly("h1"),
    exactly("h2"),
    exactly("h3"),
    exactly("h4"),
    exactly("h5"),
    exactly("h6"),
]);

const dataElementRuleCodec = record(
    oneOf([exactly("visible"), exactly("disabled")]),
    Codec.interface({ dataElements: array(string), condition: string })
);

const dataElementTotalsRuleCodec = Codec.interface({
    type: exactly("dataElements"),
    formula: string,
    rules: optional(dataElementRuleCodec),
});

const sectionTotalsRuleCodec = Codec.interface({
    type: exactly("sections"),
    formula: string,
    rules: optional(Codec.interface({ condition: string, sectionCodes: array(string) })),
});
const formulasType = oneOf([dataElementTotalsRuleCodec, sectionTotalsRuleCodec]);

const totalsType = Codec.interface({
    dataElementsCodes: array(string),
    formulas: optional(record(string, formulasType)),
    formula: optional(string),
    rules: optional(dataElementRuleCodec),
    texts: optional(Codec.interface({ name: optional(string), code: optional(string) })),
});

const stylesType = Codec.interface({
    title: optional(
        Codec.interface({
            backgroundColor: optional(string),
            color: optional(string),
        })
    ),
    columns: optional(
        Codec.interface({
            backgroundColor: optional(string),
            color: optional(string),
        })
    ),
    rows: optional(
        Codec.interface({
            backgroundColor: optional(string),
            color: optional(string),
        })
    ),
    totals: optional(
        Codec.interface({
            backgroundColor: optional(string),
            color: optional(string),
        })
    ),
});

const textsCodec = Codec.interface({
    header: optional(oneOf([string, selector])),
    footer: optional(oneOf([string, selector])),
    rowTotals: optional(oneOf([string, selector])),
    totals: optional(oneOf([string, selector])),
    name: optional(oneOf([string, selector])),
});

const DataStoreConfigCodec = Codec.interface({
    categoryCombinations: sectionConfig({
        viewType: optional(oneOf([exactly("name"), exactly("shortName"), exactly("formName")])),
    }),
    dataElements: sectionConfig({
        disabled: optional(boolean),
        disableComments: optional(boolean),
        rules: optional(dataElementRuleCodec),
        selection: optional(
            Codec.interface({
                optionSet: optional(selector),
                isMultiple: optional(boolean),
                widget: optional(oneOf([exactly("dropdown"), exactly("radio"), exactly("sourceType")])),
                visible: optional(
                    Codec.interface({
                        dataElementCode: optional(string),
                        value: optional(string),
                    })
                ),
            })
        ),
        texts: optional(textsCodec),
    }),

    dataSets: sectionConfig({
        disableComments: optional(boolean),
        viewType: optional(viewType),
        texts: optional(textsCodec),
        sections: optional(
            sectionConfig({
                columnsConfig: optional(record(string, Codec.interface({ rules: optional(rulesFormulaCodec) }))),
                columnsOrder: optional(record(string, number)),
                fixedHeaders: optional(boolean),
                fixedRowNames: optional(boolean),
                enableGroups: optional(boolean),
                enableTopScroll: optional(boolean),
                disableComments: optional(boolean),
                subNationalDataset: optional(string),
                sortRowsBy: optional(string),
                viewType: optional(viewType),
                texts: optional(textsCodec),
                toggle: optional(
                    Codec.interface({
                        type: oneOf([exactly("dataElement"), exactly("dataElementExternal")]),
                        code: string,
                        condition: optional(string),
                    })
                ),
                titleVariant: optional(titleVariantType),
                columnsDescriptions: optional(record(string, oneOf([string, selector]))),
                groupDescriptions: optional(record(string, oneOf([string, selector]))),
                styles: optional(stylesType),
                tabs: optional(
                    Codec.interface({
                        active: exactly(true),
                        order: oneOf([string, number]),
                        rules: optional(rulesFormulaCodec),
                    })
                ),
                periods: optional(
                    Codec.interface({
                        type: exactly("relative-interval"),
                        startOffset: number,
                        endOffset: number,
                    })
                ),
                calculateTotals: optional(
                    record(
                        string,
                        optional(
                            Codec.interface({
                                totalDeCode: optional(string),
                                disabled: optional(boolean),
                            })
                        )
                    )
                ),
                totals: optional(oneOf([totalsType, record(string, totalsType)])),
                toggleMultiple: optional(
                    Codec.interface({
                        logicalOperator: oneOf([exactly("AND"), exactly("OR")]),
                        conditions: array(
                            Codec.interface({
                                dataElement: string,
                                condition: string,
                            })
                        ),
                    })
                ),
                indicators: optional(
                    sectionConfig({
                        position: optional(
                            Codec.interface({
                                direction: oneOf([exactly("after"), exactly("before")]),
                                dataElement: string,
                            })
                        ),
                    })
                ),
                virtualColumns: optional(
                    array(
                        oneOf([
                            Codec.interface({
                                type: exactly("dataElement"),
                                dataElementCode: string,
                                dataElementRefValue: string,
                                position: number,
                                texts: optional(
                                    Codec.interface({
                                        columnNameCode: string,
                                    })
                                ),
                            }),
                            Codec.interface({
                                type: exactly("calculated"),
                                dataElementCode: string,
                                position: number,
                                texts: optional(
                                    Codec.interface({
                                        columnNameCode: string,
                                    })
                                ),
                                formula: optional(
                                    Codec.interface({
                                        value: string,
                                        dataElementCodes: array(string),
                                    })
                                ),
                            }),
                        ])
                    )
                ),
                virtualRows: optional(
                    array(
                        Codec.interface({
                            rowConstantCode: string,
                            dataElementCode: string,
                        })
                    )
                ),
            })
        ),
    }),
});

export interface DataElementConfig {
    rules?: DataElementRuleOptions;
    disabled?: boolean;
    disableComments?: boolean;
    texts?: Texts;
    selection?: {
        optionSet?: OptionSet;
        isMultiple: boolean;
        widget: Maybe<"dropdown" | "radio" | "sourceType">;
        visible: { dataElementCode: string; value: string } | undefined;
    };
}

export type IndicatorConfig = { position: Maybe<{ dataElement: string; direction: "after" | "before" }> };

interface OptionSet extends NamedRef {
    code: string;
    options: Option<string>[];
}

type Selector = GetType<typeof selector>;
type DataFormStoreConfigFromCodec = GetType<typeof DataStoreConfigCodec>;

type PeriodInterval = { type: "relative-interval"; startOffset: number; endOffset: number };

function getPeriods(dataSetPeriod: string, interval: Maybe<PeriodInterval>): string[] {
    const dataSetYear = parseInt(dataSetPeriod);

    const interval2: PeriodInterval = interval || {
        type: "relative-interval",
        startOffset: -2,
        endOffset: 0,
    };

    return _(dataSetYear + interval2.startOffset)
        .range(dataSetYear + interval2.endOffset + 1)
        .map(year => year.toString())
        .value();
}

interface DataFormStoreConfig {
    custom: NonPartial<DataFormStoreConfigFromCodec>;
    optionSets: OptionSet[];
    constants: Constant[];
    subNationals: SubNational[];
}

const defaultDataStoreConfig: DataFormStoreConfig["custom"] = {
    dataElements: {},
    dataSets: {},
    categoryCombinations: {},
};

interface DataSet {
    id: Id;
    code: string;
    sections: Array<{ id: string; code: string }>;
}

type CategoryCombinationConfig = {
    viewType: "name" | "shortName" | "formName" | undefined;
};

export class Dhis2DataStoreDataForm {
    public dataElementsConfig: Record<Code, DataElementConfig>;
    public categoryCombinationsConfig: Record<Code, CategoryCombinationConfig>;
    public subNationals: SubNational[];
    public constants: Constant[];

    constructor(private config: DataFormStoreConfig) {
        this.dataElementsConfig = this.getDataElementsConfig();
        this.categoryCombinationsConfig = config.custom.categoryCombinations;
        this.subNationals = config.subNationals;
        this.constants = config.constants;
    }

    static async build(api: D2Api, dataSetCode?: string): Promise<Dhis2DataStoreDataForm> {
        const dataStore = api.dataStore(Namespaces.D2_AUTOGEN_FORMS);
        if (!dataSetCode) {
            console.warn(`Unable to load configuration: dataSetCode not defined`);
            return new Dhis2DataStoreDataForm({
                optionSets: [],
                constants: [],
                custom: defaultDataStoreConfig,
                subNationals: [],
            });
        }
        const storeValue = await dataStore.get<object>(dataSetCode).getData();
        if (!storeValue)
            return new Dhis2DataStoreDataForm({
                optionSets: [],
                constants: [],
                custom: defaultDataStoreConfig,
                subNationals: [],
            });

        const config: DataFormStoreConfig = await DataStoreConfigCodec.decode(storeValue).caseOf<
            Promise<DataFormStoreConfig>
        >({
            Left: async errorMsg => {
                console.warn("Cannot decode autogenerated forms config", errorMsg);
                return { optionSets: [], constants: [], custom: defaultDataStoreConfig, subNationals: [] };
            },
            Right: async storeConfigFromDataStore => {
                const storeConfig: DataFormStoreConfig["custom"] = {
                    dataElements: storeConfigFromDataStore.dataElements || {},
                    dataSets: storeConfigFromDataStore.dataSets || {},
                    categoryCombinations: storeConfigFromDataStore.categoryCombinations || {},
                };

                return {
                    custom: storeConfig,
                    optionSets: await this.getOptionSets(api, storeConfig),
                    constants: await this.getConstants(api, storeConfig),
                    subNationals: await this.getSubNationals(api, storeConfig),
                };
            },
        });

        return new Dhis2DataStoreDataForm(config);
    }

    private static async getOptionSets(api: D2Api, storeConfig: DataFormStoreConfig["custom"]): Promise<OptionSet[]> {
        const codes = _(storeConfig.dataElements)
            .values()
            .map(obj => obj.selection?.optionSet)
            .compact()
            .map(sel => sel.code)
            .value();

        if (_.isEmpty(codes)) return [];

        const res = await api.metadata
            .get({
                optionSets: {
                    fields: {
                        id: true,
                        name: true,
                        code: true,
                        options: { code: true, displayName: true },
                    },
                    filter: { code: { in: codes } },
                },
            })
            .getData();

        return res.optionSets.map(
            (optionSet): OptionSet => ({
                ...optionSet,
                options: optionSet.options.map(option => ({
                    name: option.displayName,
                    value: option.code,
                })),
            })
        );
    }

    private static async getConstants(api: D2Api, storeConfig: DataFormStoreConfig["custom"]): Promise<Constant[]> {
        const dataElementTexts = _(storeConfig.dataElements)
            .values()
            .map(x => (x.texts ? x.texts : undefined))
            .compact()
            .value();

        const dataSetTexts = _(storeConfig.dataSets)
            .values()
            .map(x => (x.texts ? x.texts : undefined))
            .compact()
            .value();

        const sectionTexts = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => _.values(dataSet.sections))
            .flatMap(section => section.texts)
            .compact()
            .value();

        const descriptionCodes = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => _.values(dataSet.sections))
            .flatMap(section => _.concat(_.values(section.columnsDescriptions), _.values(section.groupDescriptions)))
            .flatMap(text => [typeof text !== "string" ? text.code : undefined])
            .compact()
            .value();

        const totalsCodes = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => _.values(dataSet.sections))
            .flatMap(section => {
                if (!section.totals) return undefined;

                const formulaCodes = _(section.totals.formulas)
                    .map((_, key) => key)
                    .compact()
                    .value();

                return this.isSectionTotals(section.totals)
                    ? [section.totals.texts?.code, ...formulaCodes]
                    : _(section.totals)
                          .map(total => total.texts?.code)
                          .value();
            })
            .compact()
            .value();

        const virtualColumnsCodes = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => _.values(dataSet.sections))
            .flatMap(section => {
                if (!section.virtualColumns) return [];

                return section.virtualColumns.map(vc => vc.texts?.columnNameCode);
            })
            .compact()
            .value();

        const virtualRowsCodes = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => _.values(dataSet.sections))
            .flatMap(section => {
                if (!section.virtualRows) return [];

                return section.virtualRows.map(vc => vc.rowConstantCode);
            })
            .compact()
            .value();

        const virtualCodes = virtualColumnsCodes.concat(virtualRowsCodes);

        const codes = _([...dataSetTexts, ...dataElementTexts, ...sectionTexts])
            .flatMap(t => [
                typeof t.header !== "string" ? t.header : undefined,
                typeof t.footer !== "string" ? t.footer : undefined,
                typeof t.rowTotals !== "string" ? t.rowTotals : undefined,
                typeof t.totals !== "string" && !Array.isArray(t.totals) ? t.totals : undefined,
                typeof t.name !== "string" ? t.name : undefined,
            ])
            .compact()
            .map(selector => selector.code)
            .concat([...descriptionCodes, ...totalsCodes])
            .uniq()
            .value();

        const totalConstants = codes.length + virtualCodes.length;

        if (totalConstants === 0) return [];

        const res = await api.metadata
            .get({
                constants: {
                    fields: { id: true, code: true, displayDescription: true },
                    filter: { code: { in: [...codes, ...virtualCodes] } },
                },
            })
            .getData();

        return res.constants;
    }

    private static async getSubNationals(
        api: D2Api,
        storeConfig: DataFormStoreConfig["custom"]
    ): Promise<SubNational[]> {
        const subNationalIds = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => _.values(dataSet.sections))
            .flatMap(section => section.subNationalDataset)
            .compact()
            .value();

        const response = await api.metadata
            .get({
                dataSets: {
                    filter: {
                        id: {
                            in: subNationalIds,
                        },
                    },
                    fields: {
                        id: true,
                        organisationUnits: {
                            id: true,
                            name: true,
                            parent: {
                                id: true,
                            },
                        },
                    },
                },
            })
            .getData();

        const orgUnits = response.dataSets.flatMap(ds => ds.organisationUnits);

        return orgUnits.map(d2OrgUnit => {
            return {
                id: d2OrgUnit.id,
                name: d2OrgUnit.name,
                parentId: d2OrgUnit.parent.id,
            };
        });
    }

    private getCommentsVisibility(dataSetValue: Maybe<boolean>, sectionValue: Maybe<boolean>) {
        return sectionValue ?? dataSetValue ?? false;
    }

    getDataSetConfig(dataSet: DataSet, period: Period): DataSetConfig {
        const dataSetConfig = this.config.custom.dataSets?.[dataSet.code];
        const dataSetDefaultViewType = dataSetConfig?.viewType || defaultViewType;
        const constantsByCode = _.keyBy(this.config.constants, getCode);

        const sections = _(dataSetConfig?.sections)
            .toPairs()
            .map(([code, sectionConfig]) => {
                const section = dataSet.sections.find(section => section.code === code);
                if (!section) return;
                const viewType = sectionConfig.viewType || dataSetDefaultViewType;

                const base: BaseSectionConfig = {
                    toggle: sectionConfig.toggle || { type: "none" },
                    texts: {
                        header: this.getTextFromConstants(sectionConfig?.texts?.header, constantsByCode),
                        footer: this.getTextFromConstants(sectionConfig?.texts?.footer, constantsByCode),
                        rowTotals: this.getTextFromConstants(sectionConfig?.texts?.rowTotals, constantsByCode),
                        totals: this.getTextFromConstants(sectionConfig?.texts?.totals, constantsByCode),
                        name: this.getTextFromConstants(sectionConfig?.texts?.name, constantsByCode),
                    },
                    sortRowsBy: sectionConfig.sortRowsBy || "",
                    tabs: sectionConfig.tabs || { active: false },
                    titleVariant: sectionConfig.titleVariant,
                    disableComments: this.getCommentsVisibility(
                        dataSetConfig?.disableComments,
                        sectionConfig.disableComments
                    ),
                    styles: SectionStyle.buildSectionStyles(sectionConfig.styles),
                    columnsDescriptions: _.mapValues(sectionConfig.columnsDescriptions, columnDescription =>
                        this.getTextFromConstants(columnDescription, constantsByCode)
                    ),
                    groupDescriptions: _.mapValues(sectionConfig.groupDescriptions, groupDescription =>
                        this.getTextFromConstants(groupDescription, constantsByCode)
                    ),
                    totals: this.getSectionTotals(sectionConfig, constantsByCode),
                    toggleMultiple: sectionConfig.toggleMultiple,
                    indicators: sectionConfig.indicators,
                    fixedHeaders: sectionConfig.fixedHeaders || false,
                };

                const baseConfig = { ...base, viewType };

                switch (viewType) {
                    case "grid-with-periods": {
                        const config = {
                            ...baseConfig,
                            viewType,
                            periods: getPeriods(period, sectionConfig.periods),
                        };
                        return [section.id, config] as [typeof section.id, typeof config];
                    }
                    case "table":
                    case "grid":
                    case "grid-with-totals": {
                        const config = {
                            ...baseConfig,
                            viewType,
                            calculateTotals: sectionConfig.calculateTotals,
                            columnsOrder: sectionConfig.columnsOrder,
                            fixedRowNames: sectionConfig.fixedRowNames || false,
                            enableGroups: sectionConfig.enableGroups || false,
                            enableTopScroll: sectionConfig.enableTopScroll || false,
                            columnsConfig: sectionConfig.columnsConfig,
                        };
                        return [section.id, config] as [typeof section.id, typeof config];
                    }
                    case "grid-with-subnational-ous": {
                        const config = {
                            ...baseConfig,
                            viewType,
                            calculateTotals: sectionConfig.calculateTotals,
                            subNationalDataset: sectionConfig.subNationalDataset || "",
                            columns: undefined,
                        };
                        return [section.id, config] as [typeof section.id, typeof config];
                    }
                    case "grid-indicators-calculated": {
                        const config = {
                            ...baseConfig,
                            periods: getPeriods(period, sectionConfig.periods),
                            virtualColumns: sectionConfig.virtualColumns ?? [],
                            virtualRows: sectionConfig.virtualRows ?? [],
                            viewType,
                        };
                        return [section.id, config];
                    }
                    default: {
                        const config = { ...baseConfig, viewType };
                        return [section.id, config] as [typeof section.id, typeof config];
                    }
                }
            })
            .compact()
            .fromPairs()
            .value();

        return {
            texts: {
                header: this.getTextFromConstants(dataSetConfig?.texts?.header, constantsByCode),
                footer: this.getTextFromConstants(dataSetConfig?.texts?.footer, constantsByCode),
                rowTotals: this.getTextFromConstants(dataSetConfig?.texts?.rowTotals, constantsByCode),
                totals: this.getTextFromConstants(dataSetConfig?.texts?.totals, constantsByCode),
                name: this.getTextFromConstants(dataSetConfig?.texts?.name, constantsByCode),
            },
            sections: sections,
        };
    }

    private getSectionTotals(
        sectionConfig: {
            totals: Maybe<TotalsConfig>;
            texts: Maybe<{ totals: Maybe<string | { code: string }> }>;
        },
        constantsByCode: Record<string, Constant>
    ): Record<string, SectionTotals> | undefined {
        const { totals, texts } = sectionConfig;
        if (!totals) return undefined;

        if (Dhis2DataStoreDataForm.isSectionTotals(totals)) {
            const sectionTotalsText = texts?.totals || totals.texts?.name;
            const totalsText = this.getTextFromConstants(sectionTotalsText, constantsByCode);

            return {
                [totalsText || ""]: {
                    ...totals,
                    texts: {
                        name: this.getTextFromConstants(sectionTotalsText, constantsByCode) || "",
                    },
                    formulas: _(totals.formulas)
                        .mapKeys((_, key) =>
                            constantsByCode[key] ? this.getTextFromConstants({ code: key }, constantsByCode) : key
                        )
                        .value(),
                },
            };
        } else {
            return _(totals)
                .map((sectionTotals, key) => {
                    const constantCodeOrValue = sectionTotals.texts?.name || { code: sectionTotals.texts?.code ?? "" };
                    const constantValue = this.getTextFromConstants(constantCodeOrValue, constantsByCode) ?? key;

                    return [
                        constantValue,
                        {
                            ...sectionTotals,
                            texts: {
                                name: this.getTextFromConstants(sectionTotals.texts?.name, constantsByCode) || "",
                            },
                        },
                    ] as [string, SectionTotals];
                })
                .fromPairs()
                .value();
        }
    }

    private static isSectionTotals(config: TotalsConfig): config is SectionTotals {
        return "dataElementsCodes" in config;
    }

    private getDataElementsConfig(): Record<Code, DataElementConfig> {
        const constantsByCode = _.keyBy(this.config.constants, getCode);
        return _(this.config.custom.dataElements)
            .toPairs()
            .map(([code, config]) => {
                const optionSetSelector = config?.selection;

                const optionSetRef = optionSetSelector?.optionSet;
                const optionSet = optionSetRef
                    ? this.config.optionSets.find(optionSet => selectorMatches(optionSet, optionSetRef))
                    : undefined;

                const deToHideCode = config.selection?.visible?.dataElementCode;
                const deToHideValue = config.selection?.visible?.value;

                const dataElementConfig: DataElementConfig = {
                    disableComments: config.disableComments,
                    rules: config.rules,
                    texts: {
                        header: this.getTextFromConstants(config.texts?.header, constantsByCode),
                        footer: this.getTextFromConstants(config.texts?.footer, constantsByCode),
                        rowTotals: this.getTextFromConstants(config.texts?.rowTotals, constantsByCode),
                        totals: this.getTextFromConstants(config.texts?.totals, constantsByCode),
                        name: this.getTextFromConstants(config.texts?.name, constantsByCode),
                    },
                    selection: {
                        isMultiple: optionSetSelector?.isMultiple || false,
                        optionSet: optionSet,
                        widget: optionSetSelector?.widget,
                        visible:
                            !_.isUndefined(deToHideCode) && !_.isUndefined(deToHideValue)
                                ? { dataElementCode: deToHideCode, value: deToHideValue }
                                : undefined,
                    },
                };

                return [code, dataElementConfig] as [typeof code, typeof dataElementConfig];
            })
            .compact()
            .fromPairs()
            .value();
    }

    private getTextFromConstants(
        value: string | { code: string } | undefined,
        constantsByCode: Record<string, Constant>
    ): Maybe<string> {
        return typeof value === "string" ? value : value ? constantsByCode[value.code]?.displayDescription : "";
    }
}

function selectorMatches<T extends { code: string }>(obj: T, selector: Selector): boolean {
    return obj.code === selector.code;
}

interface Constant {
    id: Id;
    code: Code;
    displayDescription: string;
}

function sectionConfig<T extends Record<string, Codec<any>>>(properties: T) {
    return optional(record(string, Codec.interface(properties)));
}

export type SubNational = {
    id: Id;
    parentId: Id;
    name: string;
};
