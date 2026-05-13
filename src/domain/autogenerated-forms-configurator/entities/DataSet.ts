import { Id, CodedRef } from "../../common/entities/Base";

export type DataSet = CodedRef & {
    id: Id;
    configExists: boolean;
    hasCustomForm: boolean;
};
