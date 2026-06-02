import { Id, CodedRef } from "../../common/entities/Base";

export type DataSet = CodedRef & {
    id: Id;
    configExists: boolean;
    hasCustomForm: boolean;
    canBeModified: boolean;
};

export type DataElementRef = { id: Id; name: string };

export type DataSetDetail = DataSet & {
    sections: Array<{ id: Id }>;
    dataElements: DataElementRef[];
};
