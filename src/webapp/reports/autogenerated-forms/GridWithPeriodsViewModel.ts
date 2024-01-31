import _ from "lodash";
import { Section, SectionWithPeriods, Texts } from "../../../domain/common/entities/DataForm";
import { DataElement } from "../../../domain/common/entities/DataElement";

interface GridWithPeriodsI {
    id: string;
    name: string;
    rows: Row[];
    periods: string[];
    toggle: Section["toggle"];
    texts: Texts;
}

interface DataElementRow {
    type: "dataElement" | "dataElementFile";
    dataElement: DataElement;
}

interface DataElementGroup {
    type: "group";
    name: string;
    rows: DataElementRow[] | Row[];
}

type Row = DataElementGroup | DataElementRow;

const separator = /:| - /;

export class GridWithPeriodsViewModel {
    static get(section: SectionWithPeriods): GridWithPeriodsI {
        const rows = _(section.dataElements)
            .groupBy(dataElement => processName(dataElement.name)[0])
            .toPairs()
            .map(([groupName, dataElementsForGroup]): Row => {
                if (dataElementsForGroup.length === 1) {
                    return {
                        type: dataElementsForGroup[0].type === "FILE" ? "dataElementFile" : "dataElement",
                        dataElement: dataElementsForGroup[0],
                    };
                } else {
                    const subGroups: DataElement[] = _.map(dataElementsForGroup, dataElement => {
                        const [_group, ...subGroups] = processName(dataElement.name);
                        const name = subGroups.join(" - ");

                        return {
                            ...dataElement,
                            name: name,
                        };
                    });

                    return {
                        name: processName(groupName)[0] ?? "",
                        type: "group",
                        rows: getSubGroupRows(subGroups),
                    };
                }
            })
            .value();

        return {
            id: section.id,
            name: section.name,
            rows: rows,
            periods: section.periods,
            toggle: section.toggle,
            texts: section.texts,
        };
    }
}

const processName = (name: string): string[] => {
    const [group, ...subGroups] = name.split(separator).map(part => part.trim());

    return [group ?? "", subGroups.join(":")];
};

function getSubGroupRows(dataElements: DataElement[]): Row[] {
    const rows: Row[] = _(dataElements)
        .groupBy(dataElement => processName(dataElement.name)[0])
        .toPairs()
        .map(([groupName, dataElementsForGroup]): Row => {
            if (dataElementsForGroup.length === 1) {
                return {
                    dataElement: dataElementsForGroup[0],
                    type: dataElementsForGroup[0].type === "FILE" ? "dataElementFile" : "dataElement",
                };
            } else {
                const rows: DataElementRow[] = _.map(dataElementsForGroup, item => ({
                    dataElement: {
                        ...item,
                        name: _.last(processName(item.name)) ?? "",
                    },
                    type: item.type === "FILE" ? "dataElementFile" : "dataElement",
                }));

                return {
                    name: groupName,
                    type: "group",
                    rows: rows,
                };
            }
        })
        .value();

    return rows;
}
