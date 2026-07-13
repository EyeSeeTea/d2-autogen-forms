import "dotenv-flow/config";
import * as XLSX from "xlsx";
import { ArgumentParser } from "argparse";
import { Code } from "../domain/common/entities/Base";
import _ from "lodash";
import { readFile, writeFile } from "fs/promises";

type OrgUnitToggleCondition = {
    type: "orgUnit";
    orgUnits: Code[];
    condition: "show" | "hide";
    disabled?: boolean;
    dataElements?: Code[];
};

type ToggleMultiple = {
    logicalOperator: "OR" | "AND";
    conditions: OrgUnitToggleCondition[];
};

type SectionConfig = {
    toggleMultiple?: ToggleMultiple;
};

type Config = Record<"dataSets", Record<Code, { sections: Record<Code, SectionConfig> }>>;

type XLSXSheetRule = {
    iso3: Code;
    country: string;
    dcyear: number;
    dc_compact_form: number;
    dc_ecdc: number;
    dc_universal_access_dx_display: number;
    dc_ppm_display: number;
    dc_engage_community_display: number;
    dc_finance_display: number;
};

type SheetRule = {
    country: string;
    countryCode: Code;
    compactForm: boolean;
    ecdc: boolean;
    universalAccessDxDisplay: boolean;
    ppmDisplay: boolean;
    engageCommunityDisplay: boolean;
    financeDisplay1: boolean;
    financeDisplay2: boolean;
};

type RuleType =
    | "compactForm"
    | "ecdc"
    | "universalAccessDxDisplay"
    | "ppmDisplay"
    | "engageCommunityDisplay"
    | "financeDisplay1"
    | "financeDisplay2";

const metadata: {
    dataSetCode: Code;
    sections: Record<RuleType, Code[]>;
    dataElements: Partial<Record<RuleType, Record<Code, Code[]>>>;
} = {
    dataSetCode: "TUB_ANNUAL_DATA",
    sections: {
        compactForm: [
            "TUB_TB_NOTIFICATIONS_HISTORY_SITE_DIAGNOSTIC",
            "TUB_TB_NOTIF_HISTORY_SITE_DIAGNOSTIC_METHOD",
            "TUB_TOTAL_NEW_AND_NOTIFIED_CASES",
            "TUB_CASES_AMONG_FOREIGN_BORN_INDIVIDUALS",
            "TUB_NEW_RELAPSE_TB_CASES_NEW",
            "TUB_AGE_GROUP",
            "TUB_RECOMMENDED_RAPID_DIAGNOSTIC_TESTS",
        ],
        ecdc: [
            "TUB_TB_NOTIFICATIONS_HISTORY_SITE_DIAGNOSTIC",
            "TUB_TB_NOTIF_HISTORY_SITE_DIAGNOSTIC_METHOD",
            "TUB_TOTAL_NEW_AND_NOTIFIED_CASES",
            "TUB_CASES_AMONG_FOREIGN_BORN_INDIVIDUALS",
            "TUB_NEW_RELAPSE_TB_CASES_NEW",
            "TUB_AGE_GROUP",
            "TUB_RECOMMENDED_RAPID_DIAGNOSTIC_TESTS",
            "TUB_DIAGNOSIS_ENROLMENT_TREATMENT",
            "TUB_COHORT_SIZES_TREATMENT_OUTCOME_MONITORING",
            "TUB_ANTI_TB_DRUG_RESISTANCE_SURVEILLANCE",
            "TUB_TREATMENT_OUTCOMES_TB_PATIENTS_REGISTERED",
            "TUB_TB_HIV",
        ],
        engageCommunityDisplay: [
            "TUB_MULTISECTORAL_ENGAGEMENT_COMMUNITY_ENGAGEMENT",
            "TUB_REFERRALS_COMMUNITY_HEALTH_WORKERS_COMMUNITY",
            "TUB_TREATMENT_ADHERENCE_SUPPORT_COMMUNITY_HEALTH",
            "TUB_COMM_REPRESENTATION_NATIONAL_DECISION_MAKING",
            "TUB_LEVEL_COMMITTED_FUNDING_COMMUNITY_ENGAGEMENT",
        ],
        financeDisplay1: ["TUB_BUDGETS_EXPENDITURE", "TUB_BUDGET_TB_PREVENTION"],
        financeDisplay2: [
            "TUB_BUDGET_FISCAL_YEAR",
            "TUB_TOTAL_EXPECTED_FUNDING",
            "TUB_EXPENDITURE",
            "TUB_TOTAL_RECEIVED_FUNDING",
        ],
        ppmDisplay: ["TUB_MULTISECTORAL_ENGAGEMENT_PUBLIC_PRIVATE_MIX"],
        universalAccessDxDisplay: [
            "TUB_UNIVERSAL_ACCESS_RAPID_TB_DIAGNOSTICS",
            "TUB_BENCHMARK_DISTRICTS_CHEST_X_RAY",
            "TUB_STEP_ACCESSING_TESTING",
            "TUB_BENCHMARK_PRIMARY_HEALTH_CARE_FACILITIES",
            "TUB_BENCHMARK_RECOMMENDED_RAPID_DIAGNOSTIC_TESTING",
            "TUB_STEP_TESTED",
            "TUB_BENCHMARK_INDIVIDUALS_PRESUMPTIVE_TB_TESTED",
            "TUB_STEP_RECEIVING_DIAGNOSIS",
            "TUB_BENCHMARK_TB_TESTING_LABORATORIES_ACHIEVE",
        ],
    },
    dataElements: {
        ecdc: { TUB_TB_HIV: ["TUB_newrel_hivtest", "TUB_newrel_hivpos"] },
    },
};

async function main() {
    const parser = new ArgumentParser();

    parser.add_argument("-u", "--user-auth", {
        help: "DHIS2 authentication (default: DHIS2_USERNAME and DHIS2_PASSWORD env vars)",
        metavar: "USERNAME:PASSWORD",
        required: false,
    });

    parser.add_argument("--url", {
        help: "DHIS2 base URL (default: DHIS2_URL env var)",
        metavar: "URL",
        required: false,
    });

    parser.add_argument("-c", "--config", {
        help: "Path to the config file",
        metavar: "FILE",
        required: true,
    });

    parser.add_argument("-r", "--rules-sheet", {
        help: "Path to the Excel sheet containing the rules",
        metavar: "FILE",
        required: true,
    });

    parser.add_argument("-o", "--output", {
        help: "Path to the output JSON file",
        metavar: "FILE",
        required: false,
    });

    const { config, rules_sheet, user_auth, url, output } = parser.parse_args();

    const envAuth = process.env.VITE_DHIS2_AUTH || "";
    const [username, password] = user_auth ? user_auth.split(":", 2) : envAuth.split(":", 2);
    const baseUrl = url || process.env.VITE_DHIS2_BASE_URL;

    if (!username || !password) {
        console.error(
            "Error: Username and password must be provided via --user-auth argument or environment variables"
        );
        return;
    }

    if (!baseUrl) {
        console.error("Error: Base URL must be provided via --url argument or DHIS2_URL environment variable");
        return;
    }

    const autogenConfig = await parseConfigFromFile(config);
    const sheetRules = parseRulesFromExcel(rules_sheet);

    const outputData = buildSectionsConfigFromSheetRules(autogenConfig, sheetRules);
    const outputFilePath = output ?? "output.json";
    await writeFile(outputFilePath, JSON.stringify(outputData, null, 2), "utf8");

    console.debug(`Output written to ${outputFilePath}`);
}

main();

async function parseConfigFromFile(configPath: string): Promise<Config> {
    const text = await readFile(configPath, "utf8");
    const autogenConfig: Config = JSON.parse(text);

    return autogenConfig;
}

function buildSectionsConfigFromSheetRules(config: Config, sheetRules: SheetRule[]): Config {
    const { dataSetCode, sections } = metadata;
    const sectionsConfig = config.dataSets[dataSetCode]?.sections;

    if (!sectionsConfig) {
        console.error("Error: No sections found in the config data set");
        return config;
    }

    const countryRulesMap = mapSheetRulesToCountryCodes(sheetRules);

    const updatedSectionsConfig = _(sectionsConfig)
        .map((sectionConfig, sectionCode) => {
            const applicableRules = ruleConfigs.filter(({ ruleType, invertSectionMatch }) => {
                const sectionInList = sections[ruleType].includes(sectionCode);
                return invertSectionMatch ? !sectionInList : sectionInList;
            });

            if (applicableRules.length === 0) {
                return { [sectionCode]: sectionConfig };
            }

            const rulesWithDataElements = applicableRules.filter(rule => {
                const ruleDataElements = metadata.dataElements[rule.ruleType]?.[sectionCode];
                return ruleDataElements && ruleDataElements.length > 0;
            });

            const rulesWithoutDataElements = applicableRules.filter(rule => {
                const ruleDataElements = metadata.dataElements[rule.ruleType]?.[sectionCode];
                return !ruleDataElements || ruleDataElements.length === 0;
            });

            const dataElementConditions = rulesWithDataElements.map(rule => {
                const ruleDataElements = metadata.dataElements[rule.ruleType]?.[sectionCode] ?? [];
                return {
                    type: "orgUnit" as const,
                    orgUnits: countryRulesMap[rule.ruleType],
                    condition: rule.condition,
                    disabled: rule.disabled ?? false,
                    dataElements: ruleDataElements,
                };
            });

            const sectionConditionGroups = _(rulesWithoutDataElements)
                .groupBy(rule => rule.condition)
                .mapValues((rules, condition) => {
                    const allOrgUnits = _(rules)
                        .flatMap(rule => countryRulesMap[rule.ruleType])
                        .uniq()
                        .value();

                    const disabled = rules.some(rule => rule.disabled);

                    return {
                        type: "orgUnit" as const,
                        orgUnits: allOrgUnits,
                        condition: condition as "show" | "hide",
                        disabled: disabled,
                    };
                })
                .value();

            const sectionConditions = _(sectionConditionGroups)
                .values()
                .filter(condition => condition.orgUnits.length > 0)
                .value();

            const allConditions = [...sectionConditions, ...dataElementConditions].filter(
                condition => condition.orgUnits.length > 0
            );

            if (allConditions.length === 0) {
                return { [sectionCode]: sectionConfig };
            }

            const toggleMultiple: ToggleMultiple = {
                logicalOperator: "OR",
                conditions: allConditions,
            };

            return {
                [sectionCode]: {
                    ...sectionConfig,
                    toggleMultiple: toggleMultiple,
                },
            };
        })
        .value();

    return {
        ...config,
        dataSets: {
            ...config.dataSets,
            [dataSetCode]: {
                ...config.dataSets[dataSetCode],
                sections: _.reduce(
                    updatedSectionsConfig,
                    (sections, sectionConfig) => ({
                        ...sections,
                        ...sectionConfig,
                    }),
                    {}
                ),
            },
        },
    };
}

function mapSheetRulesToCountryCodes(sheetRules: SheetRule[]) {
    return sheetRules.reduce<Record<RuleType, Code[]>>(
        (acc, sheetRule) => {
            const {
                countryCode,
                compactForm,
                ecdc,
                universalAccessDxDisplay,
                ppmDisplay,
                engageCommunityDisplay,
                financeDisplay1,
                financeDisplay2,
            } = sheetRule;

            return {
                ...acc,
                compactForm: compactForm ? [...acc.compactForm, countryCode] : acc.compactForm,
                ecdc: ecdc ? [...acc.ecdc, countryCode] : acc.ecdc,
                universalAccessDxDisplay: universalAccessDxDisplay
                    ? [...acc.universalAccessDxDisplay, countryCode]
                    : acc.universalAccessDxDisplay,
                ppmDisplay: ppmDisplay ? [...acc.ppmDisplay, countryCode] : acc.ppmDisplay,
                engageCommunityDisplay: engageCommunityDisplay
                    ? [...acc.engageCommunityDisplay, countryCode]
                    : acc.engageCommunityDisplay,
                financeDisplay1: financeDisplay1 ? [...acc.financeDisplay1, countryCode] : acc.financeDisplay1,
                financeDisplay2: financeDisplay2 ? [...acc.financeDisplay2, countryCode] : acc.financeDisplay2,
            };
        },
        {
            compactForm: [],
            ecdc: [],
            universalAccessDxDisplay: [],
            ppmDisplay: [],
            engageCommunityDisplay: [],
            financeDisplay1: [],
            financeDisplay2: [],
        }
    );
}

function parseRulesFromExcel(rulesSheetPath: string): SheetRule[] {
    const rulesWorkbook = XLSX.readFile(rulesSheetPath);
    const rulesSheetName = rulesWorkbook.SheetNames[0];
    if (!rulesSheetName) {
        console.error("Error: No sheets found in the rules Excel file");
        return [];
    }
    const rulesSheet = rulesWorkbook.Sheets[rulesSheetName];
    const rulesData = rulesSheet ? XLSX.utils.sheet_to_json<XLSXSheetRule>(rulesSheet) : [];

    return rulesData
        .filter(row => row.dcyear === REPORTING_YEAR)
        .map(row => ({
            country: row.country,
            countryCode: row.iso3,
            compactForm: Boolean(row.dc_compact_form),
            ecdc: Boolean(row.dc_ecdc),
            universalAccessDxDisplay: Boolean(row.dc_universal_access_dx_display),
            ppmDisplay: Boolean(row.dc_ppm_display),
            engageCommunityDisplay: Boolean(row.dc_engage_community_display),
            financeDisplay1: row.dc_finance_display === 0,
            financeDisplay2: row.dc_finance_display === 1,
        }));
}

const ruleConfigs: {
    ruleType: RuleType;
    condition: "show" | "hide";
    disabled?: boolean;
    invertSectionMatch?: boolean;
}[] = [
    { ruleType: "compactForm", condition: "hide", disabled: true, invertSectionMatch: true },
    { ruleType: "compactForm", condition: "show", disabled: false, invertSectionMatch: false },
    { ruleType: "ecdc", condition: "hide", disabled: true },
    { ruleType: "engageCommunityDisplay", condition: "show", disabled: true },
    { ruleType: "ppmDisplay", condition: "show", disabled: true },
    { ruleType: "universalAccessDxDisplay", condition: "show", disabled: true },
    { ruleType: "financeDisplay1", condition: "show", disabled: true },
    { ruleType: "financeDisplay2", condition: "show", disabled: true },
];

const REPORTING_YEAR = 2025;
