import { Id } from "../../common/entities/Base";
import { CustomForm } from "../entities/CustomForm";

export interface CustomFormRepository {
    get(dataSetId: Id): Promise<CustomForm>;
    install(dataSetId: Id, htmlCode: string): Promise<void>;
}
