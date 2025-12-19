import "dotenv-flow/config";
import * as XLSX from "xlsx";
import { ArgumentParser } from "argparse";
import { Code } from "../domain/common/entities/Base";
import _ from "lodash";
import { readFile, writeFile } from "fs/promises";

// Take autogen config json as input
// Take excel sheet as input and parse for org unit toggles
// Add config to each section
// config format:
// {
//   "SECTION_CODE": {
//     "toggle": {
//       "type": "orgUnit",
//       "orgUnits": ["TOGGLE_OU_CODE_1", "TOGGLE_OU_CODE_2"],
//       "condition": "show", // or "hide",
//       "disabled": true, // or false or undefined
//     }
//   }
// }

// Code                                 Rule                                                    Section Codes                                       Condition (show/hide)
// dc_compact_form                      show only these sections, hide all other sections       TUB_TB_NOTIFICATIONS_HISTORY_SITE_DIAGNOSTIC        hide ??
//                                                                                              TUB_TB_NOTIF_HISTORY_SITE_DIAGNOSTIC_METHOD
//                                                                                              TUB_PREVIOUSLY_TREATED_PATIENTS
//                                                                                              TUB_CASES_AMONG_FOREIGN_BORN_INDIVIDUALS
//                                                                                              TUB_NEW_RELAPSE_TB_CASES_NEW
//                                                                                              TUB_AGE_GROUP
//                                                                                              TUB_RECOMMENDED_RAPID_DIAGNOSTIC_TESTS
// dc_universal_access_dx_display       show sections for ous, hide for others                  TUB_UNIVERSAL_ACCESS_RAPID_TB_DIAGNOSTICS           show
//                                                                                              TUB_BENCHMARK_DISTRICTS_CHEST_X_RAY
//                                                                                              TUB_STEP_ACCESSING_TESTING
//                                                                                              TUB_BENCHMARK_PRIMARY_HEALTH_CARE_FACILITIES
//                                                                                              TUB_BENCHMARK_RECOMMENDED_RAPID_DIAGNOSTIC_TESTING
//                                                                                              TUB_STEP_TESTED
//                                                                                              TUB_BENCHMARK_INDIVIDUALS_PRESUMPTIVE_TB_TESTED
//                                                                                              TUB_STEP_RECEIVING_DIAGNOSIS
//                                                                                              TUB_BENCHMARK_TB_TESTING_LABORATORIES_ACHIEVE
// dc_ppm_display                       show section for ous, hide for others                   TUB_MULTISECTORAL_ENGAGEMENT_PUBLIC_PRIVATE_MIX      show
// dc_engage_community_display          show section for ous, hide for others                   TUB_MULTISECTORAL_ENGAGEMENT_COMMUNITY_ENGAGEMENT    show
//                                                                                              TUB_REFERRALS_COMMUNITY_HEALTH_WORKERS_COMMUNITY
//                                                                                              TUB_TREATMENT_ADHERENCE_SUPPORT_COMMUNITY_HEALTH
//                                                                                              TUB_COMM_REPRESENTATION_NATIONAL_DECISION_MAKING
//                                                                                              TUB_LEVEL_COMMITTED_FUNDING_COMMUNITY_ENGAGEMENT
// dc_finance_display                   if 0, 4.1 and 4.2 are shown for ous, hidden for others  TUB_BUDGETS_EXPENDITURE                             show
//                                                                                              TUB_BUDGET_TB_PREVENTION
//                                      if 1, 4.1 to 4.41 are shown for ous, hidden for others  TUB_BUDGET_FISCAL_YEAR
//                                                                                              TUB_TOTAL_EXPECTED_FUNDING
//                                                                                              TUB_EXPENDITURE_FISCAL_YEAR
//                                                                                              TUB_TOTAL_RECEIVED_FUNDING
// dc_ecdc                              disable the questions for ous

type OrgUnitToggle = {
    type: "orgUnit";
    orgUnits: Code[];
    dataElements?: Code[];
    condition: "show" | "hide";
    disabled?: boolean;
};

type SectionConfig = {
    toggle: OrgUnitToggle;
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
            "TUB_PREVIOUSLY_TREATED_PATIENTS",
            "TUB_CASES_AMONG_FOREIGN_BORN_INDIVIDUALS",
            "TUB_NEW_RELAPSE_TB_CASES_NEW",
            "TUB_AGE_GROUP",
            "TUB_RECOMMENDED_RAPID_DIAGNOSTIC_TESTS",
        ],
        ecdc: [
            "TUB_TB_NOTIFICATIONS_HISTORY_SITE_DIAGNOSTIC",
            "TUB_TB_NOTIF_HISTORY_SITE_DIAGNOSTIC_METHOD",
            "TUB_PREVIOUSLY_TREATED_PATIENTS",
            "TUB_CASES_AMONG_FOREIGN_BORN_INDIVIDUALS",
            "TUB_NEW_RELAPSE_TB_CASES_NEW",
            "TUB_AGE_GROUP",
            "TUB_RECOMMENDED_RAPID_DIAGNOSTIC_TESTS",
            "TUB_DIAGNOSIS_ENROLMENT_TREATMENT",
            "TUB_COHORT_SIZES_TREATMENT_OUTCOME_MONITORING",
            "TUB_ANTI_TB_DRUG_RESISTANCE_SURVEILLANCE",
            "TUB_TREATMENT_OUTCOMES_TB_PATIENTS_REGISTERED",
            "TUB_TREATMENT_OUTCOMES_PEOPLE_AGED_YEARS",
            "TUB_TREATMENT_OUTCOMES_DISAGGREGATED_SEX_TB",
            "TUB_TREATMENT_OUTCOMES_PATIENTS_STARTED_TREATMENT",
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
            "TUB_EXPENDITURE_FISCAL_YEAR",
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

    const envAuth = process.env.REACT_APP_DHIS2_AUTH || "";
    const [username, password] = user_auth ? user_auth.split(":", 2) : envAuth.split(":", 2);
    const baseUrl = url || process.env.REACT_APP_DHIS2_BASE_URL;

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

    const ruleConfigs: Array<{
        ruleType: RuleType;
        condition: "show" | "hide";
        disabled?: boolean;
    }> = [
        // { ruleType: "compactForm", condition: "hide", disabled: true },
        { ruleType: "ecdc", condition: "show", disabled: true },
        { ruleType: "engageCommunityDisplay", condition: "show", disabled: true },
        { ruleType: "ppmDisplay", condition: "show", disabled: true },
        { ruleType: "universalAccessDxDisplay", condition: "show", disabled: true },
        // { ruleType: "financeDisplay1", condition: "show", disabled: true },
        // { ruleType: "financeDisplay2", condition: "show", disabled: true },
    ];

    const updatedSectionsConfig = _(sectionsConfig)
        .map((sectionConfig, key) => {
            const result = ruleConfigs.reduce<Record<string, SectionConfig>>(
                (acc, { ruleType, condition, disabled }) => {
                    if (
                        (ruleType === "compactForm" && !sections["compactForm"].includes(key)) ||
                        (ruleType !== "compactForm" && sections[ruleType].includes(key))
                    ) {
                        const dataElements = metadata.dataElements?.[ruleType]?.[key];

                        const toggle = buildOuToggle({
                            sheetRules: sheetRules,
                            sectionConfig: sectionConfig,
                            sectionCode: key,
                            ruleType: ruleType,
                            condition: condition,
                            disabled: disabled,
                            dataElements: dataElements,
                        });

                        return { ...acc, ...toggle };
                    }
                    return acc;
                },
                { [key]: sectionConfig }
            );

            return result;
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

type OuToggleProps = {
    sheetRules: SheetRule[];
    sectionConfig: SectionConfig;
    sectionCode: string;
    ruleType: RuleType;
    condition: "show" | "hide";
    disabled?: boolean;
    dataElements?: Code[];
};

function mapSheetRulesToCountryCodes(sheetRules: SheetRule[]) {
    return sheetRules.reduce<Record<RuleType, Code[]>>(
        (acc, sheetRule) => {
            const {
                countryCode,
                ecdc,
                universalAccessDxDisplay,
                ppmDisplay,
                engageCommunityDisplay,
                financeDisplay1,
                financeDisplay2,
            } = sheetRule;

            // // If compactForm is true, only add to compactForm and skip all others
            // if (compactForm) {
            //     return {
            //         ...acc,
            //         compactForm: [...acc.compactForm, countryCode],
            //     };
            // }

            return {
                ...acc,
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

function buildOuToggle(props: OuToggleProps) {
    const { dataElements, sheetRules, sectionConfig, ruleType, condition, disabled, sectionCode } = props;
    const countryRulesMap = mapSheetRulesToCountryCodes(sheetRules);
    const countryCodes = countryRulesMap[ruleType];

    return {
        [sectionCode]: {
            ...sectionConfig,
            toggle: {
                type: "orgUnit" as const,
                orgUnits: countryCodes,
                condition: condition,
                disabled: disabled,
                dataElements: dataElements,
            },
        },
    };
}

function parseRulesFromExcel(rulesSheetPath: string): SheetRule[] {
    const currentYear = new Date().getFullYear();

    const rulesWorkbook = XLSX.readFile(rulesSheetPath);
    const rulesSheetName = rulesWorkbook.SheetNames[0];
    if (!rulesSheetName) {
        console.error("Error: No sheets found in the rules Excel file");
        return [];
    }
    const rulesSheet = rulesWorkbook.Sheets[rulesSheetName];
    const rulesData = rulesSheet ? XLSX.utils.sheet_to_json<XLSXSheetRule>(rulesSheet) : [];

    return rulesData
        .filter(row => row.dcyear === currentYear)
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
