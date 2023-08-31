import _ from "lodash";
import { UnionFromValues } from "../../../utils/ts-utils";
import { Id, NamedRef, Ref } from "./Base";
import { getPath } from "./OrgUnit";
import { User } from "./User";

export interface Config {
    dataSets: Record<Id, NamedRef> | undefined;
    sections: Record<Id, NamedRef> | undefined;
    currentUser: User;
    sqlViews: Record<string, NamedRef> | undefined;
    pairedDataElementsByDataSet:
        | {
              [dataSetId: string]: Array<{ dataValueVal: Id; dataValueComment: Id }>;
          }
        | undefined;
    orgUnits: string[] | undefined;
    sectionsByDataSet:
        | {
              [dataSetId: string]: NamedRef[];
          }
        | undefined;
    years: string[] | undefined;
    approvalWorkflow: NamedRef[] | undefined;
    categoryOptionCombos: {
        default: Ref;
    };
    translations: Translations;
}

export const translationKeys = ["yes", "no"] as const;
export type Translations = Record<UnionFromValues<typeof translationKeys>, string>;

export function getMainUserPaths(config: Config) {
    return _.compact([getPath(config.currentUser.orgUnits)]);
}
