import { Maybe } from "../../../utils/ts-utils";

export interface DataElementSchema {
    dataElementCode: string;
    optionSetCode: Maybe<string>;
}
