import "dotenv-flow/config";
import { ArgumentParser } from "argparse";
import { readFile, writeFile } from "fs/promises";
import { DataStoreConfigCodec } from "../data/common/Dhis2DataStoreDataForm";
import { GetType } from "purify-ts";
import _ from "lodash";

type DataFormStoreConfigFromCodec = GetType<typeof DataStoreConfigCodec>;

/**
 * Reorders sections in the TUB_ANNUAL_DATA dataSet of a dataStore config file.
 * usage: ts-node reorder-sections.ts -i input.json -o output.json SECTION_CODE NEW_SECTION_INDEX
 */
async function main() {
    const parser = new ArgumentParser();

    parser.add_argument("-i", "--input", {
        help: "Path to the dataStore json input file",
        required: true,
    });

    parser.add_argument("-o", "--output", {
        help: "Path to the output JSON file",
        required: false,
    });

    parser.add_argument("dataSetCode", {
        help: "The dataSet code to reorder",
    });

    parser.add_argument("sectionCode", {
        help: "The section code to reorder",
    });

    parser.add_argument("newSection", {
        help: "The new order for the section",
    });

    const { input, output, dataSetCode, sectionCode, newSection } = parser.parse_args();
    const config = await parseConfigFromFile(input);
    const sections = config.dataSets?.[dataSetCode]?.sections;
    if (!sections) {
        throw new Error(`No sections found in the config for dataSet ${dataSetCode}`);
    }
    debug(sections);

    // Parse section/subsection from the order field
    const parseSectionOrder = (order: string | number): { section: number; subsection: number } => {
        const orderStr = String(order);
        const parts = orderStr.split(".");
        const section = parseInt(parts[0] || "0");
        const subsection = parseInt(parts[1] || "0");
        return { section, subsection };
    };

    // Find the target section
    const targetSection = sections[sectionCode];
    if (!targetSection || !targetSection.tabs) {
        throw new Error(`Section ${sectionCode} not found or has no tabs`);
    }

    const currentOrder = targetSection.tabs.order;
    const { section: oldSection } = parseSectionOrder(currentOrder);
    const targetNewSection = parseInt(newSection);

    if (oldSection === targetNewSection) {
        throw new Error(`Section ${sectionCode} is already in section ${targetNewSection}`);
    }

    // Collect all sections with their parsed orders
    const sectionEntries = Object.entries(sections).map(([key, section]) => {
        const order = _.get(section, "tabs.order");
        const { section: sectionNum, subsection } = parseSectionOrder(order);
        return { key, section: sectionNum, subsection, originalOrder: order };
    });

    // Determine shift direction
    const isMovingDown = targetNewSection > oldSection;

    // Update section numbers
    for (const entry of sectionEntries) {
        const sectionObj = sections[entry.key];
        if (!sectionObj || !sectionObj.tabs) continue;

        if (entry.section === oldSection) {
            // Move all sections with the same main section number to new position, keeping subsection
            const newOrder =
                entry.subsection > 9
                    ? `${targetNewSection}.${entry.subsection}`
                    : targetNewSection + entry.subsection / 10;
            sectionObj.tabs.order = newOrder;
        } else if (isMovingDown) {
            // Moving down: shift sections between oldSection+1 and targetNewSection down by 1
            if (entry.section > oldSection && entry.section <= targetNewSection) {
                const newSectionNum = entry.section - 1;
                const newOrder =
                    entry.subsection > 9
                        ? `${newSectionNum}.${entry.subsection}`
                        : newSectionNum + entry.subsection / 10;
                sectionObj.tabs.order = newOrder;
            }
        } else {
            // Moving up: shift sections between targetNewSection and oldSection-1 up by 1
            if (entry.section >= targetNewSection && entry.section < oldSection) {
                const newSectionNum = entry.section + 1;
                const newOrder =
                    entry.subsection > 9
                        ? `${newSectionNum}.${entry.subsection}`
                        : newSectionNum + entry.subsection / 10;
                sectionObj.tabs.order = newOrder;
            }
        }
    }

    debug(sections);

    if (output) {
        await writeFile(output, JSON.stringify(config, null, 2), "utf8");
    } else {
        throw new Error("Output file is required");
    }
}

main();

function debug(sections: any) {
    const sectionOrder: [string, string | number][] = Object.entries(sections).map(([key, section]) => [
        key,
        _.get(section, "tabs.order"),
    ]);
    console.debug(sectionOrder);
}

async function parseConfigFromFile(configPath: string): Promise<DataFormStoreConfigFromCodec> {
    const text = await readFile(configPath, "utf8");
    return JSON.parse(text);
}
