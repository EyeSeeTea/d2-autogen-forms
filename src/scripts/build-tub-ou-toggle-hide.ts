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

const CsvSectionColumns = [
    "show_names_to_cite",
    "show_tb_notifications_by_history",
    "show_diagnosis_enrolment",
    "show_drug_resistance_surveillance",
    "show_tbhiv",
    "show_treatment_outcomes",
    "show_tb_deaths",
    "show_screening",
    "show_tb_in_prisons",
    "show_infection_control",
    "show_lab_diagnostic_services",
    "show_universal_access_rapid_diagnostics",
    "show_public_private_mix",
    "show_community_engagement",
    "show_budget_and_expenditure",
    "show_budget",
    "show_expenditure",
    "show_utilisation_health_services",
    "show_implementation_of_maf_tb",
] as const;

type CsvSectionColumn = typeof CsvSectionColumns[number];

type CsvRow = { iso3: Code } & {
    [key in CsvSectionColumn]: 1 | 0;
};

const CsvSectionToDatasetSections: Record<CsvSectionColumn, readonly Code[]> = {
    show_names_to_cite: ["TUB_NAMES_CITE_ACKNOWLEDGEMENTS_GLOBAL_TB"],
    show_tb_notifications_by_history: [
        "TUB_TB_NOTIFICATIONS_HISTORY_SITE_DIAGNOSTIC",
        "TUB_TB_NOTIF_HISTORY_SITE_DIAGNOSTIC_METHOD",
        "TUB_TOTAL_NEW_AND_NOTIFIED_CASES",
        "TUB_CASES_AMONG_FOREIGN_BORN_INDIVIDUALS",
        "TUB_NEW_RELAPSE_TB_CASES_NEW",
        "TUB_AGE_GROUP",
        "TUB_RECOMMENDED_RAPID_DIAGNOSTIC_TESTS",
    ],
    show_diagnosis_enrolment: [
        "TUB_DIAGNOSIS_ENROLMENT_TREATMENT",
        "TUB_COHORT_SIZES_TREATMENT_OUTCOME_MONITORING",
        "TUB_MONITORING_SPECIFIC_TREATMENT_REGIMENS",
    ],
    show_drug_resistance_surveillance: [
        "TUB_ANTI_TB_DRUG_RESISTANCE_SURVEILLANCE",
        "TUB_RIFAMPICIN_TESTING_AMONG_RECURRENT_RELAPSE",
        "TUB_ISONIAZID_SUSC_TESTING_AMONG_PEOPLE_PULM",
        "TUB_ISONIAZID_SUSCEPTIBILITY_TESTING_AMONG_PEOPLE",
        "TUB_RESULTS_SECOND_LINE_DRUG_SUSCEPTIBILITY",
        "TUB_BEDAQUILINE_LINEZOLID_SUSC_TESTING_AMONG",
        "TUB_TESTING_RESISTANCE_OTHER_DRUGS_AMONG",
    ],
    show_tbhiv: ["TUB_TB_HIV", "TUB_GLOBAL_AIDS_MONITORING"],
    show_treatment_outcomes: [
        "TUB_TREATMENT_OUTCOMES_TB_PATIENTS_REGISTERED",
        "TUB_TREATMENT_OUTCOMES_PEOPLE_AGED_YEARS",
        "TUB_TREATMENT_COHORTS_PEOPLE_AGED_0_14_YEARS",
        "TUB_TREATMENT_OUTCOMES_DISAGGREGATED_SEX_TB",
        "TUB_TREATMENT_COHORTS_DISAGGREGATED_SEX_TB",
        "TUB_TREATMENT_OUTCOMES_PATIENTS_STARTED_TREATMENT",
    ],
    show_tb_deaths: ["TUB_TB_DEATHS_RECORDED"],
    show_screening: [
        "TUB_SCREENING_CONTACT_INVESTIGATION_TB_PREVENTIVE",
        "TUB_CONTACT_INVESTIGATION",
        "TUB_TB_PREVENTIVE_TREATMENT_INITIATION",
        "TUB_COMPLETION_TB_PREVENTIVE_TREATMENT",
        "TUB_SHORTER_TB_PREVENTIVE_TREATMENT_REGIMENS",
    ],
    show_tb_in_prisons: ["TUB_MULTISECTORAL_ENGAGEMENT_DETECTION_TB_PRISONS"],
    show_infection_control: ["TUB_TB_INFECTION_CONTROL"],
    show_lab_diagnostic_services: [
        "TUB_LAB_DIAGNOSTIC_SERVICES",
        "TUB_MOLECULAR_RECOMMENDED_RAPID_DIAGNOSTIC_TESTING",
        "TUB_SITES_PERFORMING_TB_DIAGNOSTIC_TESTING",
        "TUB_NUMBER_SITES_PROVIDING_SERVICES",
    ],
    show_universal_access_rapid_diagnostics: [
        "TUB_UNIVERSAL_ACCESS_RAPID_TB_DIAGNOSTICS",
        "TUB_STEP_1_IDENTIFYING_PRESUMPTIVE_TB",
        "TUB_BENCHMARK_1_ALL_HOUSEHOLD_CONTACTS",
        "TUB_BENCHMARK_DISTRICTS_CHEST_X_RAY",
        "TUB_STEP_2_ACCESSING_TESTING",
        "TUB_STEP_ACCESSING_TESTING",
        "TUB_BENCHMARK_PRIMARY_HEALTH_CARE_FACILITIES",
        "TUB_BENCHMARK_5_DIAG_TEST",
        "TUB_BENCHMARK_RECOMMENDED_RAPID_DIAGNOSTIC_TESTING",
        "TUB_STEP_3_BEING_TESTED",
        "TUB_STEP_TESTED",
        "TUB_BENCHMARK_INDIVIDUALS_PRESUMPTIVE_TB_TESTED",
        "TUB_BENCHMARK_9_UNIV_DST",
        "TUB_STEP_4_RECEIVING_DIAGNOSIS",
        "TUB_BENCHMARK_10_INIT_RDT",
        "TUB_STEP_RECEIVING_DIAGNOSIS",
        "TUB_BENCHMARK_TB_TESTING_LABORATORIES_ACHIEVE",
    ],
    show_public_private_mix: ["TUB_MULTISECTORAL_ENGAGEMENT_PUBLIC_PRIVATE_MIX"],
    show_community_engagement: [
        "TUB_MULTISECTORAL_ENGAGEMENT_COMMUNITY_ENGAGEMENT",
        "TUB_MULTISECTORAL_ENGAGEMENT_COMMUNITY_REF_Q",
        "TUB_REFERRALS_COMMUNITY_HEALTH_WORKERS_COMMUNITY",
        "TUB_MULTISECTORAL_ENGAGEMENT_COMMUNITY_TREAT_Q",
        "TUB_TREATMENT_ADHERENCE_SUPPORT_COMMUNITY_HEALTH",
        "TUB_COMM_REPRESENTATION_NATIONAL_DECISION_MAKING",
        "TUB_LEVEL_COMMITTED_FUNDING_COMMUNITY_ENGAGEMENT",
    ],
    show_budget_and_expenditure: ["TUB_BUDGETS_EXPENDITURE", "TUB_BUDGET_TB_PREVENTION"],
    show_budget: ["TUB_BUDGET_FISCAL_YEAR", "TUB_TOTAL_EXPECTED_FUNDING"],
    show_expenditure: ["TUB_EXPENDITURE", "TUB_TOTAL_RECEIVED_FUNDING"],
    show_utilisation_health_services: ["TUB_UTILIZATION_HEALTH_SERVICES", "TUB_FACILITY_TYPE"],
    show_implementation_of_maf_tb: [
        "TUB_MAF_TB_ASSESSMENT",
        "TUB_REVIEW_MECHANISM_CIVIL_SOCIETY_COMMUNITY",
        "TUB_INTER_MINISTERIAL_COLLABORATION",
        "TUB_LINKAGES_PRIVATE_SECTOR",
        "TUB_REPORTING_REVIEWING",
        "TUB_MAF_TB_IMPLEMENTATION_PLAN",
        "TUB_HEALTH_SOCIAL_BENEFITS_PEOPLE_TB",
    ],
} as const;

async function main() {
    const parser = new ArgumentParser();

    parser.add_argument("-i", "--input", {
        help: "Path to the dataStore json input file",
        required: true,
    });

    parser.add_argument("-r", "--rules-sheet", {
        help: "Path to the Excel sheet containing the simplified rules",
        required: true,
    });

    parser.add_argument("-o", "--output", {
        help: "Path to the output JSON file",
        required: false,
    });

    const { input, rules_sheet, output } = parser.parse_args();

    const autogenConfig = await parseConfigFromFile(input);
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

/**
 * modifies dataSetConfig in place
 */
function updateSectionToggleCondition(
    dataSetConfig: Config["dataSets"][Code],
    sectionCode: Code,
    conditionObj: OrgUnitToggleCondition,
    needsCondition: boolean
): void {
    const sectionConfig = dataSetConfig.sections[sectionCode];

    if (!needsCondition) {
        if (!sectionConfig?.toggleMultiple) return;

        const nonOrgUnitConditions = sectionConfig.toggleMultiple.conditions.filter(c => c.type !== "orgUnit");
        if (nonOrgUnitConditions.length === 0) {
            delete sectionConfig.toggleMultiple;
        } else {
            sectionConfig.toggleMultiple.conditions = nonOrgUnitConditions;
        }
        return;
    }

    // Ensure section config exists
    if (!sectionConfig) {
        console.warn("Warning: Section config not found for section code", sectionCode, "creating one");
        dataSetConfig.sections[sectionCode] = {
            toggleMultiple: {
                logicalOperator: "OR",
                conditions: [conditionObj],
            },
        };
        return;
    }

    // Ensure toggleMultiple exists
    if (!sectionConfig.toggleMultiple) {
        console.warn("Warning: toggleMultiple config not found for section code", sectionCode, "creating one");
        sectionConfig.toggleMultiple = {
            logicalOperator: "OR",
            conditions: [conditionObj],
        };
        return;
    }

    // Update conditions: keep non-orgUnit conditions and add the new orgUnit condition
    const nonOrgUnitConditions = sectionConfig.toggleMultiple.conditions.filter(c => c.type !== "orgUnit");
    sectionConfig.toggleMultiple.conditions = [...nonOrgUnitConditions, conditionObj];
}

function buildSectionsConfigFromSheetRules(config: Config, sheetRules: CsvRow[]): Config {
    const hideBySection = Object.keys(CsvSectionToDatasetSections).map(sectionTitleInCsv => {
        const hide = sheetRules.filter(row => row[sectionTitleInCsv as CsvSectionColumn] === 0).map(row => row.iso3);
        const show = sheetRules.filter(row => row[sectionTitleInCsv as CsvSectionColumn] === 1).map(row => row.iso3);
        const showHide = hide.length <= show.length;
        return [
            sectionTitleInCsv,
            { orgUnits: showHide ? hide : show, condition: (showHide ? "hide" : "show") as "show" | "hide" },
        ] as const;
    });

    const updatedConfig: Config = _.cloneDeep(config);

    hideBySection.forEach(([sectionTitleInCsv, { orgUnits, condition }]) => {
        const datasetSections = CsvSectionToDatasetSections[sectionTitleInCsv as CsvSectionColumn];
        datasetSections.forEach(datasetSectionCode => {
            Object.values(updatedConfig.dataSets).forEach(dataSetConfig => {
                const conditionObj: OrgUnitToggleCondition = {
                    type: "orgUnit",
                    orgUnits: orgUnits,
                    condition: condition,
                };
                const needsCondition = condition === "show" || orgUnits.length > 0;

                updateSectionToggleCondition(dataSetConfig, datasetSectionCode, conditionObj, needsCondition);
            });
        });
    });

    return updatedConfig;
}

function parseRulesFromExcel(rulesSheetPath: string): CsvRow[] {
    const rulesWorkbook = XLSX.readFile(rulesSheetPath);
    const rulesSheetName = rulesWorkbook.SheetNames[0];
    if (!rulesSheetName) {
        console.error("Error: No sheets found in the rules Excel file");
        return [];
    }
    const rulesSheet = rulesWorkbook.Sheets[rulesSheetName];
    const rulesData = rulesSheet ? XLSX.utils.sheet_to_json<CsvRow>(rulesSheet) : [];

    return rulesData;
}
