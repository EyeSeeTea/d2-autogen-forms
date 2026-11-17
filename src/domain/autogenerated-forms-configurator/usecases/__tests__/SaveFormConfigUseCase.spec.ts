import { AutogenConfig } from "../../../common/entities/AutogenConfig";
import { Code } from "../../../common/entities/Base";
import { SectionPeriod } from "../../../common/entities/SectionPeriod";
import { getSectionPeriodsIssue, SectionPeriodsInput } from "../../../common/entities/SectionPeriodsConfig";
import { AutogenConfigRepository } from "../../repositories/AutogenConfigRepository";
import { SaveFormConfigUseCase } from "../SaveFormConfigUseCase";

const DATA_SET_CODE = "MAL-PR-MF";
const SECTION_ID = "LBL_INSECTICIDE_USAGE";
const OTHER_SECTION_ID = "LBL_NETS";
const relativeInterval: SectionPeriod = { type: "relative-interval", startOffset: -2, endOffset: 0 };
const sectionOffset: SectionPeriod = { type: "section-offset", offset: -1 };

class AutogenConfigTestRepository implements AutogenConfigRepository {
    private configs: ReadonlyMap<Code, AutogenConfig> = new Map();

    async get(dataSetCode: Code): Promise<AutogenConfig> {
        const config = this.configs.get(dataSetCode);
        if (!config) throw new Error(`No configuration found for dataset: ${dataSetCode}`);
        return config;
    }

    async delete(dataSetCode: Code): Promise<void> {
        this.configs = new Map([...this.configs].filter(([code]) => code !== dataSetCode));
    }

    async save(dataSetCode: Code, config: AutogenConfig): Promise<void> {
        this.configs = new Map([...this.configs, [dataSetCode, config]]);
    }
}

function buildConfig(sections: Record<string, SectionPeriodsInput>): AutogenConfig {
    return { dataSets: { [DATA_SET_CODE]: { sections } } };
}

function section(viewType: SectionPeriodsInput["viewType"], periods: SectionPeriod): SectionPeriodsInput {
    return { viewType, periods };
}

function errorMessage(sectionId: string, sectionConfig: SectionPeriodsInput): string {
    return getSectionPeriodsIssue(sectionId, sectionConfig)?.message ?? "";
}

async function save(config: AutogenConfig) {
    const repository = new AutogenConfigTestRepository();
    const result = await new SaveFormConfigUseCase(repository).execute(DATA_SET_CODE, config).then(
        () => undefined,
        (error: Error) => error.message
    );
    const saved = await repository.get(DATA_SET_CODE).catch(() => undefined);
    return { error: result, saved };
}

describe("SaveFormConfigUseCase", () => {
    describe("valid config", () => {
        it("saves a section-offset on a grid", async () => {
            const config = buildConfig({ [SECTION_ID]: section("grid", sectionOffset) });

            expect(await save(config)).toEqual({ error: undefined, saved: config });
        });

        it("saves a table relative-interval that has an ignored endOffset", async () => {
            const config = buildConfig({ [SECTION_ID]: section("table", relativeInterval) });

            expect(await save(config)).toEqual({ error: undefined, saved: config });
        });

        it("saves a config that has only warnings", async () => {
            const config = buildConfig({ [SECTION_ID]: section("matrix-grid", sectionOffset) });

            expect(await save(config)).toEqual({ error: undefined, saved: config });
        });
    });

    describe("invalid periods config", () => {
        it("rejects a grid section with a relative-interval and does not save", async () => {
            const gridSection = section("grid", relativeInterval);

            expect(await save(buildConfig({ [SECTION_ID]: gridSection }))).toEqual({
                error: errorMessage(SECTION_ID, gridSection),
                saved: undefined,
            });
        });

        it("joins the messages of every invalid section into one error", async () => {
            const gridSection = section("grid", relativeInterval);
            const matrixSection = section("matrix-grid", relativeInterval);
            const config = buildConfig({ [SECTION_ID]: gridSection, [OTHER_SECTION_ID]: matrixSection });

            expect(await save(config)).toEqual({
                error: [errorMessage(SECTION_ID, gridSection), errorMessage(OTHER_SECTION_ID, matrixSection)].join(" "),
                saved: undefined,
            });
        });
    });
});
