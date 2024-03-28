/* eslint-disable @typescript-eslint/no-unused-vars */
import _ from "lodash";
import { NamedRef } from "../../domain/common/entities/Base";
import { DEFAULT_CATEGORY_OPTION_COMBO_CODE } from "../../domain/common/entities/CategoryOptionCombo";
import { Config, translationKeys, Translations } from "../../domain/common/entities/Config";
import { ReportType } from "../../domain/common/entities/ReportType";
import { User } from "../../domain/common/entities/User";
import { ConfigRepository } from "../../domain/common/repositories/ConfigRepository";
import { D2Api, Id } from "../../types/d2-api";
import { getReportType } from "../../webapp/utils/reportType";

const base = {
    nhwa: {
        dataSets: { namePrefix: "NHWA", nameExcluded: /old$/ },
        sqlViewNames: [],
        constantCode: "NHWA_COMMENTS",
        approvalWorkflows: { namePrefix: "NHWA" },
    },
    mal: {
        dataSets: { namePrefix: "MAL - WMR Form", nameExcluded: /-APVD$/ },

        sqlViewNames: [],
        constantCode: "",
        approvalWorkflows: { namePrefix: "MAL" },
    },
    cf: {
        dataSets: { namePrefix: "", nameExcluded: /.*/ },
        sqlViewNames: [],
        constantCode: "",
        approvalWorkflows: { namePrefix: "" },
    },
};

export class Dhis2ConfigRepository implements ConfigRepository {
    constructor(private api: D2Api, private type: ReportType) {}

    async get(): Promise<Config> {
        const metadata = await this.getMetadata();

        const [currentUser, translations] = await Promise.all([this.getCurrentUser(), this.getTranslations()]);
        const currentYear = new Date().getFullYear();
        const defaultCoc = metadata.categoryOptionCombos.find(coc => coc.code === "default");
        if (!defaultCoc) throw new Error("Cannot find default categoryOptionCombo");

        const baseConfig: Config = {
            dataSets: undefined,
            currentUser,
            pairedDataElementsByDataSet: undefined,
            sections: undefined,
            sqlViews: undefined,
            orgUnits: undefined,
            approvalWorkflow: undefined,
            sectionsByDataSet: undefined,
            years: _.range(currentYear - 10, currentYear + 1).map(n => n.toString()),
            categoryOptionCombos: { default: defaultCoc },
            translations: translations,
        };

        return baseConfig;
    }

    private getTranslations() {
        return this.api.post<Translations>("/i18n", {}, translationKeys).getData();
    }

    private getMetadata() {
        const metadata$ = this.api.metadata.get({
            categoryOptionCombos: {
                fields: { id: true, code: true },
                filter: { code: { eq: DEFAULT_CATEGORY_OPTION_COMBO_CODE } },
            },
        });

        return metadata$.getData();
    }

    async getCurrentUser(): Promise<User> {
        const d2User = await this.api.currentUser
            .get({
                fields: {
                    id: true,
                    displayName: true,
                    dataViewOrganisationUnits: {
                        id: true,
                        displayName: toName,
                        path: true,
                        level: true,
                    },
                    userCredentials: {
                        username: true,
                        userRoles: { id: true, name: true },
                    },
                    userGroups: { id: true, name: true },
                },
            })
            .getData();

        return {
            id: d2User.id,
            name: d2User.displayName,
            orgUnits: d2User.dataViewOrganisationUnits,
            userGroups: d2User.userGroups,
            ...d2User.userCredentials,
        };
    }
}

interface DataSet {
    id: Id;
    dataSetElements: Array<{ dataElement: NamedRef }>;
    organisationUnits: Array<{ id: Id }>;
}

type Constant = Partial<{
    sections?: Record<Id, string>;
    sectionNames?: Record<string, string>;
}>;

function getNameOfDataElementWithValue(name: string): string {
    const s = "NHWA_" + name.replace(/NHWA_Comment of /, "");
    return s.replace(" - ", " for ");
}

function getCleanName(name: string): string {
    return name
        .replace(/[^\w]$/, "") // Remove trailing non-alphanumic characters
        .replace(/\s+/g, " ") // Replace &nbps (x160) characters by normal spaces
        .trim()
        .toLowerCase();
}

function getPairedMapping(dataSets: DataSet[]): Config["pairedDataElementsByDataSet"] {
    const dataElementsByName = _(dataSets)
        .flatMap(dataSet => dataSet.dataSetElements)
        .map(dse => dse.dataElement)
        .keyBy(de => getCleanName(de.name))
        .value();

    return _(dataSets)
        .map(dataSet => {
            const mapping = getMappingForDataSet(dataSet, dataElementsByName);
            return [dataSet.id, mapping] as [string, typeof mapping];
        })
        .fromPairs()
        .value();
}

function getPairedOrgunitsMapping(dataSets: DataSet[]) {
    const orgUnitList = _(dataSets)
        .flatMap(dataSet => dataSet.organisationUnits)
        .map(ou => ou.id)
        .value();

    return orgUnitList;
}

function getMappingForDataSet(dataSet: DataSet, dataElementsByName: Record<string, NamedRef>) {
    return _(dataSet.dataSetElements)
        .map(dse => dse.dataElement)
        .filter(de => de.name.startsWith("NHWA_Comment of"))
        .map(de => {
            const name = getNameOfDataElementWithValue(de.name);
            const cleanName = getCleanName(name);
            const valueDataElement = dataElementsByName[cleanName];

            if (!valueDataElement) {
                console.error(`Value data element not found for comment:\n  ${name}`);
                return null;
            } else {
                return { dataValueVal: valueDataElement.id, dataValueComment: de.id };
            }
        })
        .compact()
        .value();
}

function getNth<T>(objs: T[], n: number, msg: string): T {
    const obj = objs[n];
    if (!obj) throw new Error(msg);
    return obj;
}

function getSectionsInfo(constantData: Constant) {
    const sectionNames = constantData.sectionNames || {};
    const jsonSections = constantData.sections || {};

    const sections = _(jsonSections)
        .values()
        .uniq()
        .sortBy()
        .map(sectionId => ({ id: sectionId, name: sectionNames[sectionId] || "" }))
        .value();

    const sectionsByDataSet = _(jsonSections)
        .toPairs()
        .map(([entryId, sectionId]) => {
            const [dataSetId] = entryId.split(".");
            return { dataSetId, sectionId };
        })
        .groupBy(obj => obj.dataSetId)
        .mapValues(objs =>
            _(objs)
                .map(obj => ({ id: obj.sectionId, name: sectionNames[obj.sectionId] || "" }))
                .uniqBy(obj => obj.id)
                .value()
        )
        .value();

    return { sections, sectionsByDataSet };
}

function getFilteredDataSets<DataSet extends NamedRef>(dataSets: DataSet[]): DataSet[] {
    const type = getReportType();
    const { namePrefix, nameExcluded } = base[type].dataSets;
    return dataSets.filter(({ name }) => name.startsWith(namePrefix) && !name.match(nameExcluded));
}

const toName = { $fn: { name: "rename", to: "name" } } as const;
