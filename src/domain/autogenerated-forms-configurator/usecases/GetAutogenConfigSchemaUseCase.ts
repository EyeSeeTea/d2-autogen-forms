import _ from "lodash";
import { Maybe } from "../../../utils/ts-utils";
import { Code } from "../../common/entities/Base";
import { AutogenConfigSchema, DataSet } from "../entities/DataSet";
import { ConstantRepository } from "../../common/repositories/ConstantRepository";

export class GetAutogenConfigSchemaUseCase {
    constructor(private constantRepository: ConstantRepository) {}

    async execute(dataSets: DataSet[], dataSetCode: Maybe<Code>): Promise<AutogenConfigSchema> {
        const dataSet = _.find(dataSets, { code: dataSetCode });
        if (!dataSetCode || !dataSet)
            return { sections: [], categoryComboCodes: [], dataElements: [], constantCodes: [] };

        const constants = await this.constantRepository.get();
        const constantCodes = constants.map(constant => constant.code);

        const dataElements = this.getDataElements(dataSet);
        const sections = this.getSections(dataSet);
        const categoryComboCodes = this.getCategoryComboCodes(dataSet);

        return {
            categoryComboCodes: categoryComboCodes,
            constantCodes: constantCodes,
            dataElements: dataElements,
            sections: sections,
        };
    }

    private getSections(dataSet: DataSet): AutogenConfigSchema["sections"] {
        return dataSet.sections.map(section => {
            const columnsDescriptions = _(section.dataElements)
                .flatMap(dataElement => dataElement.categoryCombo?.categoryOptionCombos.map(coc => coc.name))
                .compact()
                .uniq()
                .value();

            return {
                code: section.code,
                columnsDescriptions: columnsDescriptions,
            };
        });
    }

    private getDataElements(dataSet: DataSet): AutogenConfigSchema["dataElements"] {
        const sectionDEs = _(dataSet.sections)
            .flatMap(section =>
                section.dataElements.map(dataElement => ({
                    dataElementCode: dataElement.code,
                    optionSetCode: dataElement.optionSet?.code,
                }))
            )
            .value();

        const dataSetDEs = _(dataSet.dataSetElements)
            .map(dataSetElement => ({
                dataElementCode: dataSetElement.dataElement?.code,
                optionSetCode: dataSetElement.dataElement.optionSet?.code,
            }))
            .value();

        const dataElements = _.uniqBy(_.concat(sectionDEs, dataSetDEs), "dataElementCode");
        return dataElements;
    }

    private getCategoryComboCodes(dataSet: DataSet): AutogenConfigSchema["categoryComboCodes"] {
        return _(dataSet.dataSetElements)
            .map(dataSetElement => dataSetElement.categoryCombo?.code)
            .compact()
            .uniq()
            .value();
    }
}
