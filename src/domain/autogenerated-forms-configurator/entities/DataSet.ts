import { Id, CodedRef } from "../../common/entities/Base";

export type DataElementRef = { id: Id; name: string };

export type DataSet = CodedRef & {
    id: Id;
    configExists: boolean;
    hasCustomForm: boolean;
    canBeModified: boolean;
    sections: Array<{ id: Id }>;
    dataElements: DataElementRef[];
};
