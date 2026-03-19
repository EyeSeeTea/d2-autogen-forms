import "dotenv-flow/config";
import * as XLSX from "xlsx";
import { ArgumentParser } from "argparse";
import { Code } from "../domain/common/entities/Base";
import _ from "lodash";
import { readFile, writeFile } from "fs/promises";
import { SectionRule } from "../domain/common/entities/SectionRule";

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
    rules?: SectionRule[];
};

type Config = Record<"dataSets", Record<Code, { sections: Record<Code, SectionConfig> }>>;

const CsvSectionColumns = [
    "disactivate_tb_notifications_by_history",
    "disactivete_subsection_diagnosis_enrollment",
    "disactivate_subsection_cohort_sizes",
    "disactivate_drug_resistance_surveillance",
    "disactivate_subsection_testing_for_hiv",
    "disactivate_treatment_outcomes",
] as const;

type CsvSectionColumn = typeof CsvSectionColumns[number];

type CsvRow = { iso3: Code } & {
    [key in CsvSectionColumn]: 1 | 0;
};

const CsvSectionToDatasetSections: Record<CsvSectionColumn, readonly Code[]> = {
    disactivate_tb_notifications_by_history: [
        "TUB_TB_NOTIFICATIONS_HISTORY_SITE_DIAGNOSTIC",
        "TUB_TB_NOTIF_HISTORY_SITE_DIAGNOSTIC_METHOD",
        "TUB_TOTAL_NEW_AND_NOTIFIED_CASES",
        "TUB_CASES_AMONG_FOREIGN_BORN_INDIVIDUALS",
        "TUB_NEW_RELAPSE_TB_CASES_NEW",
        "TUB_AGE_GROUP",
        "TUB_RECOMMENDED_RAPID_DIAGNOSTIC_TESTS",
    ],
    disactivete_subsection_diagnosis_enrollment: ["TUB_DIAGNOSIS_ENROLMENT_TREATMENT"],
    disactivate_subsection_cohort_sizes: ["TUB_COHORT_SIZES_TREATMENT_OUTCOME_MONITORING"],
    disactivate_drug_resistance_surveillance: [
        "TUB_ANTI_TB_DRUG_RESISTANCE_SURVEILLANCE",
        "TUB_RIFAMPICIN_TESTING_AMONG_RECURRENT_RELAPSE",
        "TUB_ISONIAZID_SUSC_TESTING_AMONG_PEOPLE_PULM",
        "TUB_ISONIAZID_SUSCEPTIBILITY_TESTING_AMONG_PEOPLE",
        "TUB_RESULTS_SECOND_LINE_DRUG_SUSCEPTIBILITY",
        "TUB_BEDAQUILINE_LINEZOLID_SUSC_TESTING_AMONG",
        "TUB_TESTING_RESISTANCE_OTHER_DRUGS_AMONG",
    ],
    disactivate_subsection_testing_for_hiv: ["TUB_TB_HIV_TEST"],
    disactivate_treatment_outcomes: [
        "TUB_TREATMENT_OUTCOMES_TB_PATIENTS_REGISTERED",
        "TUB_TREATMENT_OUTCOMES_PEOPLE_AGED_YEARS",
        "TUB_TREATMENT_COHORTS_PEOPLE_AGED_0_14_YEARS",
        "TUB_TREATMENT_OUTCOMES_DISAGGREGATED_SEX_TB",
        "TUB_TREATMENT_COHORTS_DISAGGREGATED_SEX_TB",
        "TUB_TREATMENT_OUTCOMES_PATIENTS_STARTED_TREATMENT",
    ],
} as const;

const CsvSectionToDatasetSectionForMessage: Record<CsvSectionColumn, { sectionCode: Code; constantCode: Code }> = {
    disactivate_tb_notifications_by_history: {
        sectionCode: "TUB_TB_NOTIFICATIONS_HISTORY_SITE_DIAGNOSTIC",
        constantCode: "TUB_SECTION_MSG_ECDC_2",
    },
    disactivete_subsection_diagnosis_enrollment: {
        sectionCode: "TUB_DIAGNOSIS_ENROLMENT_TREATMENT",
        constantCode: "TUB_SECTION_MSG_ECDC_3",
    },
    disactivate_subsection_cohort_sizes: {
        sectionCode: "TUB_DIAGNOSIS_ENROLMENT_TREATMENT",
        constantCode: "TUB_SECTION_MSG_ECDC_3",
    },
    disactivate_drug_resistance_surveillance: {
        sectionCode: "TUB_ANTI_TB_DRUG_RESISTANCE_SURVEILLANCE",
        constantCode: "TUB_SECTION_MSG_ECDC_4",
    },
    disactivate_subsection_testing_for_hiv: { sectionCode: "TUB_TB_HIV_TEST", constantCode: "TUB_SECTION_MSG_ECDC_5" },
    disactivate_treatment_outcomes: {
        sectionCode: "TUB_TREATMENT_OUTCOMES_TB_PATIENTS_REGISTERED",
        constantCode: "TUB_SECTION_MSG_ECDC_6",
    },
};

async function main() {
    const parser = new ArgumentParser();

    parser.add_argument("-i", "--input", {
        help: "Path to the dataStore json input file",
        required: true,
    });

    parser.add_argument("-r", "--rules-sheet", {
        help: "Path to the CSV containing the simplified rules",
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
    conditionObj: OrgUnitToggleCondition
): void {
    const sectionConfig = dataSetConfig.sections[sectionCode];

    // Ensure section config exists
    if (!sectionConfig) {
        console.warn("Warning: Section config not found for section code", sectionCode, "creating one");
        dataSetConfig.sections[sectionCode] = {
            toggleMultiple: {
                logicalOperator: "OR",
                conditions: [
                    {
                        condition: "hide",
                        orgUnits: [],
                        type: "orgUnit",
                    },
                    conditionObj,
                ],
            },
        };
        return;
    }

    // Ensure toggleMultiple exists
    if (!sectionConfig.toggleMultiple) {
        console.warn("Warning: toggleMultiple config not found for section code", sectionCode, "creating one");
        sectionConfig.toggleMultiple = {
            logicalOperator: "OR",
            conditions: [
                {
                    condition: "hide",
                    orgUnits: [],
                    type: "orgUnit",
                },
                conditionObj,
            ],
        };
        return;
    }

    sectionConfig.toggleMultiple.logicalOperator = "OR";
    const existingDisabledCondition = sectionConfig.toggleMultiple.conditions.find(
        cond => cond.type === "orgUnit" && cond.condition === "show" && cond.disabled === true
    );
    // we only have one condition per section for disabling in TUB. If already set, replace orgUnits in place
    if (existingDisabledCondition) {
        existingDisabledCondition.orgUnits = conditionObj.orgUnits;
    } else {
        sectionConfig.toggleMultiple.conditions.push(conditionObj);
    }
}

// modify in-place the rules array of the section config to add the message rule
// important: no preexisting rules must exist in the base config or they will be overriden!
function updateSectionConfigWithMessages(
    dataSetConfig: Config["dataSets"][Code],
    section: string,
    rule: SectionRule
): void {
    const sectionConfig = dataSetConfig.sections[section];
    if (!sectionConfig) {
        throw new Error(
            `Section config not found for section ${section} when trying to add message rule. Expected to be already present`
        );
    }
    sectionConfig.rules = sectionConfig.rules || [];
    if (sectionConfig.rules[0]) {
        // if we apply multiple rules for the same section, we just merge the conditions assuming the rest is the same
        sectionConfig.rules[0].conditions.orgUnitIn = [
            ...new Set([...(sectionConfig.rules[0].conditions.orgUnitIn || []), ...(rule.conditions.orgUnitIn || [])]),
        ];
    } else {
        sectionConfig.rules.push(rule);
    }
}

function buildSectionsConfigFromSheetRules(config: Config, sheetRules: CsvRow[]): Config {
    const disableBySection = Object.keys(CsvSectionToDatasetSections).map(sectionTitleInCsv => {
        const show = sheetRules.filter(row => row[sectionTitleInCsv as CsvSectionColumn] === 1).map(row => row.iso3);
        return [sectionTitleInCsv, { orgUnits: show, condition: "show" as "show" | "hide", disabled: true }] as const;
    });

    const updatedConfig: Config = _.cloneDeep(config);

    disableBySection.forEach(([sectionTitleInCsv, { orgUnits, condition, disabled }]) => {
        const datasetSections = CsvSectionToDatasetSections[sectionTitleInCsv as CsvSectionColumn];
        datasetSections.forEach(datasetSectionCode => {
            Object.values(updatedConfig.dataSets).forEach(dataSetConfig => {
                const conditionObj: OrgUnitToggleCondition = {
                    type: "orgUnit",
                    orgUnits: orgUnits,
                    condition: condition,
                    disabled: disabled,
                };
                updateSectionToggleCondition(dataSetConfig, datasetSectionCode, conditionObj);
            });
        });
    });

    const messagesBySection = Object.entries(CsvSectionToDatasetSectionForMessage).map(
        ([sectionTitleInCsv, config]) => {
            const orgUnitsDisabled = sheetRules
                .filter(row => row[sectionTitleInCsv as CsvSectionColumn] === 1)
                .map(row => row.iso3);
            return [config.sectionCode, { orgUnits: orgUnitsDisabled, constant: config.constantCode }] as const;
        }
    );

    messagesBySection.forEach(([section, { orgUnits, constant }]) => {
        const ruleObj: SectionRule = {
            conditions: {
                orgUnitIn: orgUnits,
            },
            action: {
                type: "showMessage",
                text: {
                    code: constant,
                } as any,
            },
        };
        Object.values(updatedConfig.dataSets).forEach(dataSetConfig => {
            updateSectionConfigWithMessages(dataSetConfig, section, ruleObj);
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
