import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.34";
import { boolean, Codec, exactly, GetType, oneOf, optional, record, string, number, array } from "purify-ts";
import { Namespaces } from "./clients/storage/Namespaces";
import { assertUnreachable, Maybe, NonPartial } from "../../utils/ts-utils";
import { Code, getCode, Id, NamedRef } from "../../domain/common/entities/Base";
import { Option } from "../../domain/common/entities/DataElement";
import {
    CategoryColumnConfig,
    CategoryOptionFilter,
    ColumnOrder,
    DataElementsToExclude,
    DataElementWidget,
    DescriptionText,
    SectionTexts,
    Texts,
    Totals,
} from "../../domain/common/entities/DataForm";
import { titleVariant } from "../../domain/common/entities/TitleVariant";
import { SectionStyle, SectionStyleAttrs } from "../../domain/common/entities/SectionStyle";
import {
    ConditionRule,
    RuleType,
    SectionRuleOptions,
    TotalDataElementRuleOptions,
} from "../../domain/common/entities/DataElementRule";
import {
    ToggleLogicalOperator,
    ToggleMultiple,
    ToggleMultipleCondition,
} from "../../domain/common/entities/ToggleMultiple";
import { Period, PeriodType, validatePeriodType } from "../../domain/common/entities/Period";
import { FromRulesFormulaCodec, rulesFormulaCodec } from "./RulesFormula";
import { DataFormRule } from "../../domain/common/entities/DataFormRule";

export interface DataSetConfig {
    removePrefix: Maybe<string>;
    texts: Texts;
    sections: Record<Id, SectionConfig>;
    rules: Maybe<DataFormRule[]>;
    customCss: Maybe<string>;
}

export type SectionConfig =
    | BasicSectionConfig
    | GridSectionConfig
    | GridWithPeriodsSectionConfig
    | GridWithTotalsSectionConfig
    | GridWithSubnationalSectionConfig
    | GridIndicatorsCalculated
    | GridCategoryColumnsConfig;

export type TotalsRule = (
    | {
          type: "sections";
          rules?: SectionRuleOptions;
      }
    | {
          type: "dataElements";
          rules?: TotalDataElementRuleOptions;
      }
) & { formula: string };

type SectionTotals = Totals & {
    texts?: { name?: string; code?: string };
};

type TotalsConfig = SectionTotals | Record<string, SectionTotals>;

type DataElementToggle = {
    type: "dataElement";
    code: Code;
    disabled: boolean;
};

type DataElementExternalToggle = {
    type: "dataElementExternal";
    code: Code;
    condition: string | undefined;
    disabled: boolean;
};

export type OrgUnitToggle = {
    type: "orgUnit";
    orgUnits: string[];
    dataElements: string[];
    condition: "show" | "hide";
    disabled: boolean;
};

type Toggle = DataElementToggle | DataElementExternalToggle | OrgUnitToggle | { type: "none" };

interface BaseSectionConfig {
    texts: SectionTexts;
    toggle: Toggle;
    tabs: { active: true; order: string | number; rules?: FromRulesFormulaCodec } | { active: false };
    showIndex: boolean;
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
    fixedRowNames: boolean;
    enableTopScroll: boolean;
    columnsConfig?: GridColumnsConfig;
    disabled: boolean;
}

const dataElementsToExcludeCodec = Codec.interface({
    codesToExclude: array(Codec.interface({ code: string })),
    formula: Codec.interface({
        condition: string,
        value: string,
    }),
    dataElements: array(Codec.interface({ code: string })),
});

interface BasicSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-combos" | "matrix-grid" | "grid-disaggregated-cocs";
    columnsConfig?: Record<string, { rules?: FromRulesFormulaCodec }>;
}

interface GridSectionConfig extends BaseSectionConfig {
    viewType: "table" | "grid";
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    enableGroups: boolean;
    columnsConfig?: Record<
        string,
        {
            rules?: FromRulesFormulaCodec;
        }
    >;
    firstColumnConfig?: {
        width: number;
    };
    periods: Period[];
}

interface GridWithPeriodsSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-cat-option-combos" | "grid-with-periods";
    periods: Period[];
}

interface GridWithTotalsSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-totals";
    calculateTotals: CalculateTotalType;
    columnsOrder: Maybe<ColumnOrder>;
    fixedRowNames: boolean;
    enableGroups: boolean;
    enableTopScroll: boolean;
    columnsConfig?: GridColumnsConfig;
    firstColumnConfig?: {
        width: number;
    };
}

interface GridIndicatorsCalculated extends BaseSectionConfig {
    viewType: "grid-indicators-calculated";
    periods: Period[];
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

interface GridCategoryColumnsConfig extends BaseSectionConfig {
    viewType: "grid-category-columns";
    categoriesColumns: CategoryColumnConfig[];
    rowsConfig: Maybe<Record<string, { cellsVisible?: boolean; rowNameConstant?: string }>>;
    singleCategoryInColumns: boolean;
    categoryOptionFilter: Maybe<CategoryOptionFilter>;
    dataElementsToExclude: Maybe<DataElementsToExclude[]>;
}

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
    exactly("grid-disaggregated-cocs"),
    exactly("matrix-grid"),
    exactly("grid-with-periods"),
    exactly("grid-with-subnational-ous"),
    exactly("grid-indicators-calculated"),
    exactly("grid-category-columns"),
]);

const titleVariantType = oneOf([
    exactly("h1"),
    exactly("h2"),
    exactly("h3"),
    exactly("h4"),
    exactly("h5"),
    exactly("h6"),
]);

const singleConditionDERuleCodec = Codec.interface({ dataElements: array(string), condition: string });
const multipleConditionDERuleCodec = Codec.interface({
    type: exactly("option"),
    conditions: array(singleConditionDERuleCodec),
});
const stateConditionDERuleCodec = Codec.interface({
    type: exactly("state"),
    condition: oneOf([exactly("disabled")]),
});

const dataElementRuleCodec = record(
    oneOf([exactly("visible"), exactly("disabled"), exactly("enabled"), exactly("delete"), exactly("clear")]),
    oneOf([singleConditionDERuleCodec, multipleConditionDERuleCodec, stateConditionDERuleCodec])
);

const totalDataElementRuleCodec = record(
    oneOf([exactly("visible"), exactly("disabled"), exactly("enabled"), exactly("delete")]),
    oneOf([singleConditionDERuleCodec, multipleConditionDERuleCodec])
);

const dataElementTotalsRuleCodec = Codec.interface({
    type: exactly("dataElements"),
    formula: string,
    rules: optional(totalDataElementRuleCodec),
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

const textCodecModel = {
    header: optional(oneOf([string, selector])),
    footer: optional(oneOf([string, selector])),
    rowTotals: optional(oneOf([string, selector])),
    totals: optional(oneOf([string, selector])),
    name: optional(oneOf([string, selector])),
};

const textsCodec = Codec.interface(textCodecModel);

const sectionTextCodec = Codec.interface({
    ...textCodecModel,
    tabLabel: optional(oneOf([string, selector])),
});

const categoryOptionFilterConfigCodec = Codec.interface({
    dataElementCode: string,
    config: array(
        Codec.interface({
            code: string,
            disabled: optional(boolean),
            showWhenValue: optional(array(oneOf([string, exactly("null")]))),
            children: array(Codec.interface({ categoryOptionCode: string })),
        })
    ),
});

const relativeIntervalPeriodType = Codec.interface({
    type: exactly("relative-interval"),
    startOffset: number,
    endOffset: number,
});

const sectionOffsetPeriodType = Codec.interface({
    type: exactly("section-offset"),
    offset: number,
});

const periodsConfigType = oneOf([relativeIntervalPeriodType, sectionOffsetPeriodType]);

const dataElementToggleCodec = Codec.interface({
    type: oneOf([exactly("dataElement"), exactly("dataElementExternal")]),
    code: string,
    condition: optional(string),
    disabled: optional(boolean),
});

const orgUnitToggleCodec = Codec.interface({
    type: exactly("orgUnit"),
    orgUnits: array(string),
    dataElements: optional(array(string)),
    condition: oneOf([exactly("show"), exactly("hide")]),
    disabled: optional(boolean),
});

const toggleCodec = oneOf([dataElementToggleCodec, orgUnitToggleCodec]);

const dataElementToggleMultipleCodec = Codec.interface({
    type: optional(exactly("dataElement")),
    dataElement: string,
    condition: string,
    disabled: optional(boolean),
});

const orgUnitToggleMultipleCodec = Codec.interface({
    type: exactly("orgUnit"),
    orgUnits: array(string),
    condition: oneOf([exactly("show"), exactly("hide")]),
    dataElements: optional(array(string)),
    disabled: optional(boolean),
});

const toggleMultipleCodec = Codec.interface({
    logicalOperator: oneOf([exactly("AND"), exactly("OR")]),
    conditions: array(oneOf([dataElementToggleMultipleCodec, orgUnitToggleMultipleCodec])),
});

const dataSetRuleCodec = Codec.interface({
    conditions: Codec.interface({
        periodIn: optional(array(string)),
    }),
    action: Codec.interface({
        type: exactly("displayWarning"),
        text: oneOf([string, selector]),
        blockEntry: boolean,
    }),
});

const DataStoreConfigCodec = Codec.interface({
    categoryCombinations: sectionConfig({
        viewType: optional(oneOf([exactly("name"), exactly("shortName"), exactly("formName")])),
    }),
    categoryOptions: sectionConfig({
        visible: optional(boolean),
    }),
    dataElements: sectionConfig({
        disabled: optional(boolean),
        disableComments: optional(boolean),
        mirrorFrom: optional(string),
        rules: optional(dataElementRuleCodec),
        selection: optional(
            Codec.interface({
                optionSet: optional(selector),
                isMultiple: optional(boolean),
                widget: optional(
                    oneOf([exactly("dropdown"), exactly("radio"), exactly("sourceType"), exactly("checkbox")])
                ),
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
        removePrefix: optional(string),
        viewType: optional(viewType),
        texts: optional(textsCodec),
        customCss: optional(string),
        showIndex: optional(boolean),
        rules: optional(array(dataSetRuleCodec)),
        sections: optional(
            sectionConfig({
                dataElementsToExclude: optional(array(dataElementsToExcludeCodec)),
                categoryOptionFilter: optional(categoryOptionFilterConfigCodec),
                firstColumnConfig: optional(Codec.interface({ width: number })),
                singleCategoryInColumns: optional(boolean),
                rowsConfig: optional(
                    record(
                        string,
                        Codec.interface({ cellsVisible: optional(boolean), rowNameConstant: optional(string) })
                    )
                ),
                categoriesColumns: optional(array(Codec.interface({ dataElementCode: string, categoryCode: string }))),
                columnsConfig: optional(record(string, Codec.interface({ rules: optional(rulesFormulaCodec) }))),
                disabled: optional(boolean),
                columnsOrder: optional(record(string, number)),
                fixedHeaders: optional(boolean),
                fixedRowNames: optional(boolean),
                enableGroups: optional(boolean),
                enableTopScroll: optional(boolean),
                disableComments: optional(boolean),
                subNationalDataset: optional(string),
                sortRowsBy: optional(string),
                viewType: optional(viewType),
                texts: optional(sectionTextCodec),
                toggle: optional(toggleCodec),
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
                showIndex: optional(boolean),
                periods: optional(periodsConfigType),
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
                toggleMultiple: optional(toggleMultipleCodec),
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

type DataElementRule = Record<RuleType | "delete", ConditionRule>;
export interface DataElementConfig {
    rules?: DataElementRule;
    disabled?: boolean;
    disableComments?: boolean;
    mirrorFrom?: Code;
    texts?: Texts;
    selection?: {
        optionSet?: OptionSet;
        isMultiple: boolean;
        widget: Maybe<DataElementWidget>;
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
type DataSetRuleFromCodec = GetType<typeof dataSetRuleCodec>;

type PeriodInterval = { type: "relative-interval"; startOffset: number; endOffset: number };
type PeriodSectionOffset = { type: "section-offset"; offset: number };
type SectionPeriod = PeriodInterval | PeriodSectionOffset;

function getSectionPeriods(
    viewType: SectionConfig["viewType"],
    dataSetPeriod: Id,
    periodConfig: Maybe<SectionPeriod>,
    periodType: PeriodType
): Period[] {
    if (!periodConfig) return [];

    switch (periodConfig.type) {
        case "section-offset":
            return formatSectionOffsetPeriodsByPeriodType(dataSetPeriod, periodConfig.offset, periodType);
        case "relative-interval":
            return getRelativeIntervalPeriodsByViewType(viewType, dataSetPeriod, periodConfig, periodType);
    }
}

function formatSectionOffsetPeriodsByPeriodType(dataSetPeriod: Id, offset: number, periodType: PeriodType): Period[] {
    switch (periodType) {
        case PeriodType.YEARLY: {
            const year = parseInt(dataSetPeriod) + offset;
            return [{ id: year.toString(), label: year.toString() }];
        }
        // TODO: Implement other period types
        default: {
            console.warn(`PeriodType ${periodType} not implemented for section-offset`);
            const year = parseInt(dataSetPeriod) + offset;
            return [{ id: year.toString(), label: year.toString() }];
        }
    }
}

function getRelativeIntervalPeriodsByViewType(
    viewType: SectionConfig["viewType"],
    dataSetPeriod: Id,
    interval: PeriodInterval,
    periodType: PeriodType
): Period[] {
    switch (viewType) {
        case "grid-indicators-calculated":
        case "grid-with-periods": {
            const interval2: PeriodInterval = interval || {
                type: "relative-interval",
                startOffset: -2,
                endOffset: 0,
            };

            return formatRelativeIntervalPeriodsByPeriodType(dataSetPeriod, interval2, periodType);
        }
        case "grid-with-cat-option-combos":
        case "table":
            if (!interval) return [];
            return formatRelativeIntervalPeriodsByPeriodType(dataSetPeriod, interval, periodType);
        default:
            throw new Error(`Unsupported viewType ${viewType} for periods calculation`);
    }
}

function formatRelativeIntervalPeriodsByPeriodType(
    dataSetPeriod: Id,
    interval: PeriodInterval,
    periodType: PeriodType
): Period[] {
    switch (periodType) {
        case PeriodType.DAILY:
            return getDailyPeriods(dataSetPeriod, interval);
        case PeriodType.WEEKLY:
            return getWeeklyPeriods(dataSetPeriod, interval);
        case PeriodType.MONTHLY:
            return getMonthlyPeriods(dataSetPeriod, interval);
        case PeriodType.QUARTERLY:
            return getQuarterlyPeriods(dataSetPeriod, interval);
        case PeriodType.YEARLY:
            return getYearlyPeriods(dataSetPeriod, interval);
        default: {
            console.warn(`PeriodType ${periodType} not implemented`);
            return getYearlyPeriods(dataSetPeriod, interval);
        }
    }
}

function getDailyPeriods(dataSetPeriod: Id, interval: PeriodInterval): Period[] {
    const dateStr = dataSetPeriod;
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6));
    const day = parseInt(dateStr.slice(6, 8));

    const baseDate = new Date(year, month - 1, day);
    const baseDateValue = baseDate.valueOf();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startDateValue = baseDateValue + interval.startOffset * oneDayMs;
    const endDateValue = baseDateValue + interval.endOffset * oneDayMs;
    const dayCount = Math.floor((endDateValue - startDateValue) / oneDayMs) + 1;

    return Array.from({ length: dayCount }, (_, i) => {
        const currentDate = new Date(startDateValue + i * oneDayMs);
        const periodYear = currentDate.getFullYear();
        const periodMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const periodDay = currentDate.getDate().toString().padStart(2, "0");
        const id = `${periodYear}${periodMonth}${periodDay}`;
        const label = `${periodYear}-${periodMonth}-${periodDay}`;

        return { id: id, label: label };
    });
}

function getWeeklyPeriods(dataSetPeriod: Id, interval: PeriodInterval): Period[] {
    const year = parseInt(dataSetPeriod.slice(0, 4));
    const week = parseInt(dataSetPeriod.slice(5));

    const startWeekOffset = year * 53 + week - 1 + interval.startOffset;
    const endWeekOffset = year * 53 + week - 1 + interval.endOffset;

    return _(startWeekOffset)
        .range(endWeekOffset + 1)
        .map(weekOffset => {
            const periodYear = Math.floor(weekOffset / 53);
            const periodWeek = (weekOffset % 53) + 1;
            const weekStr = periodWeek.toString();
            const id = `${periodYear}W${weekStr}`;

            return { id: id, label: `${periodYear}-W${weekStr}` };
        })
        .value();
}

function getMonthlyPeriods(dataSetPeriod: Id, interval: PeriodInterval): Period[] {
    const year = parseInt(dataSetPeriod.slice(0, 4));
    const month = parseInt(dataSetPeriod.slice(4, 6));

    const startMonthOffset = year * 12 + month - 1 + interval.startOffset;
    const endMonthOffset = year * 12 + month - 1 + interval.endOffset;

    return _(startMonthOffset)
        .range(endMonthOffset + 1)
        .map(monthOffset => {
            const periodYear = Math.floor(monthOffset / 12);
            const periodMonth = (monthOffset % 12) + 1;
            const monthStr = periodMonth.toString().padStart(2, "0");
            const id = `${periodYear}${monthStr}`;
            return { id: id, label: `${periodYear}-${monthStr}` };
        })
        .value();
}

function getQuarterlyPeriods(dataSetPeriod: Id, interval: PeriodInterval): Period[] {
    const year = parseInt(dataSetPeriod.slice(0, 4));
    const quarter = parseInt(dataSetPeriod.slice(5, 6));

    const startQuarterOffset = year * 4 + quarter - 1 + interval.startOffset;
    const endQuarterOffset = year * 4 + quarter - 1 + interval.endOffset;

    return _(startQuarterOffset)
        .range(endQuarterOffset + 1)
        .map(quarterOffset => {
            const periodYear = Math.floor(quarterOffset / 4);
            const periodQuarter = (quarterOffset % 4) + 1;
            const id = `${periodYear}Q${periodQuarter}`;
            return { id: id, label: `${periodYear}-Q${periodQuarter}` };
        })
        .value();
}

function getYearlyPeriods(dataSetPeriod: Id, interval: PeriodInterval): Period[] {
    const year = parseInt(dataSetPeriod);

    return _(year + interval.startOffset)
        .range(year + interval.endOffset + 1)
        .map(year => ({ id: year.toString(), label: year.toString() }))
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
    categoryOptions: {},
};

interface DataSet {
    id: Id;
    code: string;
    sections: Array<{ id: string; code: string }>;
    periodType: string;
}

type CategoryCombinationConfig = {
    viewType: "name" | "shortName" | "formName" | undefined;
};

type CategoryOptionConfig = {
    visible: Maybe<boolean>;
};

type ToggleConfig = GetType<typeof toggleCodec>;

export class Dhis2DataStoreDataForm {
    public dataElementsConfig: Record<Code, DataElementConfig>;
    public categoryCombinationsConfig: Record<Code, CategoryCombinationConfig>;
    public categoryOptionsConfig: Record<Code, CategoryOptionConfig>;
    public subNationals: SubNational[];
    public constants: Constant[];

    constructor(private config: DataFormStoreConfig) {
        this.dataElementsConfig = this.getDataElementsConfig();
        this.categoryCombinationsConfig = config.custom.categoryCombinations;
        this.categoryOptionsConfig = config.custom.categoryOptions;
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
                    categoryOptions: storeConfigFromDataStore.categoryOptions || {},
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

        const totalsCodes: string[] = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet =>
                _.values(dataSet.sections).flatMap((section: { totals: Maybe<TotalsConfig> }) => {
                    const totals = section.totals;
                    if (!totals) return undefined;

                    const formulaCodes = totals.formulas ? Object.keys(totals.formulas) : [];

                    return this.isSectionTotals(totals)
                        ? [totals.texts?.code, ...formulaCodes]
                        : _(totals)
                              .map(total => total.texts?.code)
                              .value();
                })
            )
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

        const rowNamesKeys = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => _.values(dataSet.sections))
            .flatMap(section => _.values(section.rowsConfig))
            .map(rowConfig => rowConfig.rowNameConstant)
            .compact()
            .value();

        const virtualCodes = virtualColumnsCodes.concat(virtualRowsCodes).concat(rowNamesKeys);

        const dataSetRulesCodes = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => dataSet.rules)
            .compact()
            .flatMap(rule => {
                const warningText = rule.action.text;
                return typeof warningText !== "string" ? warningText.code : undefined;
            })
            .compact()
            .value();

        const codes = _([
            ...extractTextCodes(dataSetTexts),
            ...extractTextCodes(dataElementTexts),
            ...extractTextCodes(sectionTexts),
        ])
            .map(v => (typeof v !== "string" && !Array.isArray(v) ? v?.code : undefined))
            .compact()
            .concat([...descriptionCodes, ...totalsCodes, ...dataSetRulesCodes])
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

    private getEffectiveBooleanValue(dataSetValue: Maybe<boolean>, sectionValue: Maybe<boolean>) {
        return sectionValue ?? dataSetValue ?? false;
    }

    getDataSetConfig(dataSet: DataSet, period: Id): DataSetConfig {
        const dataSetConfig = this.config.custom.dataSets?.[dataSet.code];
        const dataSetDefaultViewType = dataSetConfig?.viewType || defaultViewType;
        const constantsByCode = _.keyBy(this.config.constants, getCode);
        const periodType = validatePeriodType(dataSet.periodType);
        const removePrefix = dataSetConfig?.removePrefix;

        const sections = _(dataSetConfig?.sections)
            .toPairs()
            .map(([code, sectionConfig]) => {
                const section = dataSet.sections.find(section => section.code === code);
                if (!section) return;
                const viewType = sectionConfig.viewType || dataSetDefaultViewType;

                const base: BaseSectionConfig = {
                    toggle: this.getSectionToggle(sectionConfig),
                    texts: {
                        header: this.getTextFromConstants(sectionConfig?.texts?.header, constantsByCode),
                        footer: this.getTextFromConstants(sectionConfig?.texts?.footer, constantsByCode),
                        rowTotals: this.getTextFromConstants(sectionConfig?.texts?.rowTotals, constantsByCode),
                        totals: this.getTextFromConstants(sectionConfig?.texts?.totals, constantsByCode),
                        name: this.getTextFromConstants(sectionConfig?.texts?.name, constantsByCode),
                        tabLabel: this.getTextFromConstants(sectionConfig?.texts?.tabLabel, constantsByCode),
                    },
                    showIndex: this.getEffectiveBooleanValue(dataSetConfig?.showIndex, sectionConfig.showIndex),
                    sortRowsBy: sectionConfig.sortRowsBy || "",
                    tabs: sectionConfig.tabs || { active: false },
                    titleVariant: sectionConfig.titleVariant,
                    disableComments: this.getEffectiveBooleanValue(
                        dataSetConfig?.disableComments,
                        sectionConfig.disableComments
                    ),
                    disabled: sectionConfig.disabled || false,
                    styles: SectionStyle.buildSectionStyles(sectionConfig.styles),
                    columnsDescriptions: _.mapValues(sectionConfig.columnsDescriptions, columnDescription =>
                        this.getTextFromConstants(columnDescription, constantsByCode)
                    ),
                    groupDescriptions: _.mapValues(sectionConfig.groupDescriptions, groupDescription =>
                        this.getTextFromConstants(groupDescription, constantsByCode)
                    ),
                    totals: this.getSectionTotals(sectionConfig, constantsByCode),
                    toggleMultiple: this.getToggleMultipleConfig(sectionConfig),
                    indicators: sectionConfig.indicators,
                    fixedHeaders: sectionConfig.fixedHeaders || false,
                    fixedRowNames: sectionConfig.fixedRowNames || false,
                    enableTopScroll: sectionConfig.enableTopScroll || false,
                    columnsConfig: sectionConfig.columnsConfig,
                };

                const baseConfig = { ...base, viewType };

                switch (viewType) {
                    case "grid-with-cat-option-combos":
                    case "grid-with-periods": {
                        const config = {
                            ...baseConfig,
                            viewType,
                            periods: getSectionPeriods(viewType, period, sectionConfig.periods, periodType),
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
                            enableGroups: sectionConfig.enableGroups || false,
                            columnsConfig: sectionConfig.columnsConfig,
                            firstColumnConfig: sectionConfig.firstColumnConfig,
                            periods: getSectionPeriods(viewType, period, sectionConfig.periods, periodType),
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
                            periods: getSectionPeriods(viewType, period, sectionConfig.periods, periodType),
                            virtualColumns: sectionConfig.virtualColumns ?? [],
                            virtualRows: sectionConfig.virtualRows ?? [],
                            viewType,
                        };
                        return [section.id, config];
                    }
                    case "grid-category-columns": {
                        const config = {
                            ...baseConfig,
                            viewType,
                            categoriesColumns: sectionConfig.categoriesColumns || [],
                            rowsConfig: sectionConfig.rowsConfig,
                            singleCategoryInColumns: sectionConfig.singleCategoryInColumns || false,
                            categoryOptionFilter: sectionConfig.categoryOptionFilter,
                            dataElementsToExclude: sectionConfig.dataElementsToExclude ?? [],
                        };
                        return [section.id, config] as [typeof section.id, typeof config];
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
            removePrefix: removePrefix,
            sections: sections,
            rules: this.getDataFormRules(dataSetConfig?.rules),
            customCss: dataSetConfig?.customCss,
        };
    }

    private getToggleMultipleConfig(sectionConfig: {
        toggleMultiple: Maybe<{
            logicalOperator: ToggleLogicalOperator;
            conditions: Array<
                | { type?: "dataElement"; dataElement: Code; condition: string }
                | { type: "orgUnit"; orgUnits: Code[]; condition: string }
            >;
        }>;
    }): Maybe<ToggleMultiple> {
        const { toggleMultiple } = sectionConfig;
        if (!toggleMultiple) return undefined;

        const conditions: ToggleMultipleCondition[] = toggleMultiple.conditions.map(condition => {
            switch (condition.type) {
                case "orgUnit":
                    return {
                        ...condition,
                        type: "orgUnit",
                        orgUnits: condition.orgUnits,
                        condition: condition.condition,
                    };
                default:
                    return {
                        ...condition,
                        type: "dataElement",
                        dataElement: condition.dataElement,
                        condition: condition.condition,
                    };
            }
        });

        return {
            ...toggleMultiple,
            conditions: conditions,
        };
    }

    private getSectionToggle(sectionConfig: { toggle: Maybe<ToggleConfig> }): Toggle {
        const { toggle } = sectionConfig;
        if (!toggle) return { type: "none" };

        switch (toggle.type) {
            case "dataElement":
                return { type: "dataElement", code: toggle.code, disabled: toggle.disabled ?? false };
            case "dataElementExternal":
                return {
                    type: "dataElementExternal",
                    code: toggle.code,
                    condition: toggle.condition,
                    disabled: toggle.disabled ?? false,
                };
            case "orgUnit":
                return { ...toggle, dataElements: toggle.dataElements ?? [], disabled: toggle.disabled ?? false };
            default:
                return assertUnreachable(toggle);
        }
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
                    disabled: config.disabled,
                    disableComments: config.disableComments,
                    mirrorFrom: config.mirrorFrom,
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

    private getDataFormRules(rulesConfig: Maybe<DataSetRuleFromCodec[]>): Maybe<DataFormRule[]> {
        if (!rulesConfig) return undefined;

        return rulesConfig.map(ruleConfig => {
            if (ruleConfig.action.type === "displayWarning") {
                return {
                    ...ruleConfig,
                    action: {
                        ...ruleConfig.action,
                        text:
                            typeof ruleConfig.action.text === "string"
                                ? ruleConfig.action.text
                                : this.getTextFromConstants(
                                      ruleConfig.action.text,
                                      _.keyBy(this.config.constants, getCode)
                                  ) || "",
                    },
                };
            }
            throw new Error(`Unsupported custom rule action type: ${ruleConfig.action.type}`);
        });
    }
}

function selectorMatches<T extends { code: string }>(obj: T, selector: Selector): boolean {
    return obj.code === selector.code;
}

function extractTextCodes<T extends Record<string, string | { code: string } | undefined>>(texts: T[]) {
    return texts.flatMap(t => Object.values(t));
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
