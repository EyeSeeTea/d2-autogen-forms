import { NamedRef } from "../../common/entities/Base";

export interface DataSet extends NamedRef {
    code: string;
    sections: { id: string; code: string }[];
}
