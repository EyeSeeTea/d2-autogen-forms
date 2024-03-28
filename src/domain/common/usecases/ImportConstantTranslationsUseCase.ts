import fs from "fs";
import { ConstantRepository } from "../repositories/ConstantRepository";
import { DataElementRepository } from "../repositories/DataElementRepository";
import { ExportDataElementConfigRepository } from "../repositories/ExportDataElementConfigRepository";
import { ImportConstantRepository } from "../repositories/ImportConstantRepository";

export class ImportConstantTranslationsUseCase {
    constructor(
        private constantRepository: ConstantRepository,
        private importConstantRepository: ImportConstantRepository,
        private dataElementRepository: DataElementRepository,
        private exportDataElementConfigRepository: ExportDataElementConfigRepository
    ) {}

    async execute(options: ImportMalariaTranslationsoptions): Promise<void> {
        console.debug(`Getting translations from ${options.path}...`);
        const constants = this.importConstantRepository.import(options.path);
        fs.writeFileSync("constants_to_import_temp.json", JSON.stringify({ constants: constants }, null, 4));
        console.debug("Saving constants with translations...");
        const stats = await this.constantRepository.save(constants, options);
        console.debug("Constants imported:", JSON.stringify(stats, null, 4));
        if (options.autogenform) {
            console.debug("Generating dataElements config. for autogenforms");
            const dataElementsCodes = constants.map(constant => constant.code);
            console.debug(`${dataElementsCodes.length} dataElements found`);
            const dataElements = await this.dataElementRepository.getByCodes(dataElementsCodes);
            console.debug("Generating autogenforms configuration...");
            await this.exportDataElementConfigRepository.export(options.autogenform, dataElements);
            console.debug(`Exporting autogenforms to ${options.autogenform}`);
        }
    }
}

export type ImportMalariaTranslationsoptions = { autogenform: string; path: string; post: boolean; export: boolean };
