import _ from "lodash";
import { D2Api } from "@eyeseetea/d2-api/2.34";
import { boolean, Codec, exactly, GetType, oneOf, optional, record, string, number } from "purify-ts";
import { Namespaces } from "./clients/storage/Namespaces";
import { Maybe, NonPartial } from "../../utils/ts-utils";
import { Code, getCode, Id, NamedRef } from "../../domain/common/entities/Base";
import { Option } from "../../domain/common/entities/DataElement";
import { Period } from "../../domain/common/entities/DataValue";
import { ColumnDescription, Texts } from "../../domain/common/entities/DataForm";
import { titleVariant } from "../../domain/common/entities/TitleVariant";
import { SectionStyle, SectionStyleAttrs } from "../../domain/common/entities/SectionStyle";

interface DataSetConfig {
    texts: Texts;
    sections: Record<Id, SectionConfig>;
}

export type SectionConfig =
    | BasicSectionConfig
    | GridWithPeriodsSectionConfig
    | GridWithTotalsSectionConfig
    | GridWithSubnationalSectionConfig;

interface BaseSectionConfig {
    texts: Texts;
    toggle: { type: "none" } | { type: "dataElement"; code: Code };
    tabs: { active: true; order: number } | { active: false };
    sortRowsBy: string;
    titleVariant: titleVariant;
    styles: SectionStyleAttrs;
    columnsDescriptions: ColumnDescription;
    disableComments: boolean;
}

interface BasicSectionConfig extends BaseSectionConfig {
    viewType: "table" | "grid" | "grid-with-combos" | "grid-with-cat-option-combos";
}

interface GridWithPeriodsSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-periods";
    periods: string[];
}

interface GridWithTotalsSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-totals";
    calculateTotals: Record<string, CalculateTotalConfig | undefined> | undefined;
}

interface GridWithSubnationalSectionConfig extends BaseSectionConfig {
    viewType: "grid-with-subnational-ous";
    subNationalDataset: string;
}

export type CalculateTotalConfig = {
    totalDeCode: Code | undefined;
    disabled: boolean | undefined;
};

const defaultViewType = "table";

const selector = Codec.interface({ code: string });

const viewType = oneOf([
    exactly("table"),
    exactly("grid"),
    exactly("grid-with-totals"),
    exactly("grid-with-combos"),
    exactly("grid-with-cat-option-combos"),
    exactly("grid-with-periods"),
    exactly("grid-with-subnational-ous"),
]);

const titleVariantType = oneOf([
    exactly("h1"),
    exactly("h2"),
    exactly("h3"),
    exactly("h4"),
    exactly("h5"),
    exactly("h6"),
]);

const stylesVariantType = Codec.interface({
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
});

const textsCodec = Codec.interface({
    header: optional(oneOf([string, selector])),
    footer: optional(oneOf([string, selector])),
});

const DataStoreConfigCodec = Codec.interface({
    categoryCombinations: sectionConfig({
        viewType: optional(oneOf([exactly("name"), exactly("shortName")])),
    }),
    dataElements: sectionConfig({
        disableComments: optional(boolean),
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
    }),

    dataSets: sectionConfig({
        disableComments: optional(boolean),
        viewType: optional(viewType),
        texts: optional(textsCodec),
        sections: optional(
            sectionConfig({
                disableComments: optional(boolean),
                subNationalDataset: optional(string),
                sortRowsBy: optional(string),
                viewType: optional(viewType),
                texts: optional(textsCodec),
                toggle: optional(
                    Codec.interface({
                        type: exactly("dataElement"),
                        code: string,
                    })
                ),
                titleVariant: optional(titleVariantType),
                styles: optional(stylesVariantType),
                columnsDescriptions: optional(record(string, oneOf([string, selector]))),
                tabs: optional(
                    Codec.interface({
                        active: exactly(true),
                        order: number,
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
            })
        ),
    }),
});

interface DataElementConfig {
    disableComments?: boolean;
    selection?: {
        optionSet?: OptionSet;
        isMultiple: boolean;
        widget: Maybe<"dropdown" | "radio" | "sourceType">;
        visible: { dataElementCode: string; value: string } | undefined;
    };
}

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
    viewType: "name" | "shortName" | undefined;
};

export class Dhis2DataStoreDataForm {
    public dataElementsConfig: Record<Code, DataElementConfig>;
    public categoryCombinationsConfig: Record<Code, CategoryCombinationConfig>;
    public subNationals: SubNational[];

    constructor(private config: DataFormStoreConfig) {
        this.dataElementsConfig = this.getDataElementsConfig();
        this.categoryCombinationsConfig = config.custom.categoryCombinations;
        this.subNationals = config.subNationals;
    }

    static async build(api: D2Api, dataSetCode?: string): Promise<Dhis2DataStoreDataForm> {
        if (cachedStore) return cachedStore;

        const dataStore = api.dataStore(Namespaces.D2_AUTOGEN_FORMS);
        if (!dataSetCode) throw Error(`Unable to load configuration: dataSetCode not defined`);
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

        cachedStore = new Dhis2DataStoreDataForm(config);
        return cachedStore;
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

        const catOptionComboDescriptionCodes = _(storeConfig.dataSets)
            .values()
            .flatMap(dataSet => _.values(dataSet.sections))
            .flatMap(section => _.values(section.columnsDescriptions))
            .flatMap(text => [typeof text !== "string" ? text.code : undefined])
            .compact()
            .value();

        const codes = _(dataSetTexts)
            .concat(sectionTexts)
            .flatMap(t => [
                typeof t.header !== "string" ? t.header : undefined,
                typeof t.footer !== "string" ? t.footer : undefined,
            ])
            .compact()
            .map(selector => selector.code)
            .concat(catOptionComboDescriptionCodes)
            .uniq()
            .value();

        if (_.isEmpty(codes)) return [];

        const res = await api.metadata
            .get({
                constants: {
                    fields: { id: true, code: true, displayDescription: true },
                    filter: { code: { in: codes } },
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

        const getText = (value: string | { code: string } | undefined) =>
            typeof value === "string" ? value : value ? constantsByCode[value.code]?.displayDescription : "";
        const sections = _(dataSetConfig?.sections)
            .toPairs()
            .map(([code, sectionConfig]) => {
                const section = dataSet.sections.find(section => section.code === code);
                if (!section) return;
                const viewType = sectionConfig.viewType || dataSetDefaultViewType;
                const base: BaseSectionConfig = {
                    toggle: sectionConfig.toggle || { type: "none" },
                    texts: {
                        header: getText(sectionConfig?.texts?.header),
                        footer: getText(sectionConfig?.texts?.footer),
                    },
                    sortRowsBy: sectionConfig.sortRowsBy || "",
                    tabs: sectionConfig.tabs || { active: false },
                    titleVariant: sectionConfig.titleVariant,
                    disableComments: this.getCommentsVisibility(
                        dataSetConfig?.disableComments,
                        sectionConfig.disableComments
                    ),
                    styles: SectionStyle.buildSectionStyles(sectionConfig.styles),
                    columnsDescriptions: _.mapValues(sectionConfig.columnsDescriptions, getText),
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
                    case "grid-with-totals": {
                        const config = {
                            ...baseConfig,
                            viewType,
                            calculateTotals: sectionConfig.calculateTotals,
                        };
                        return [section.id, config] as [typeof section.id, typeof config];
                    }
                    case "grid-with-subnational-ous": {
                        const config = {
                            ...baseConfig,
                            viewType,
                            subNationalDataset: sectionConfig.subNationalDataset || "",
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
                header: getText(dataSetConfig?.texts?.header),
                footer: getText(dataSetConfig?.texts?.footer),
            },
            sections: sections,
        };
    }

    private getDataElementsConfig(): Record<Code, DataElementConfig> {
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
}

function selectorMatches<T extends { code: string }>(obj: T, selector: Selector): boolean {
    return obj.code === selector.code;
}

interface Constant {
    id: Id;
    code: Code;
    displayDescription: string;
}

let cachedStore: Dhis2DataStoreDataForm | undefined;

function sectionConfig<T extends Record<string, Codec<any>>>(properties: T) {
    return optional(record(string, Codec.interface(properties)));
}

export type SubNational = {
    id: Id;
    parentId: Id;
    name: string;
};
