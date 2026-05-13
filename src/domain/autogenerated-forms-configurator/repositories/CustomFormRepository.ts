import { Id } from "../../common/entities/Base";

export interface CustomFormRepository {
    getInstalledHtml(dataSetId: Id): Promise<string | null>;
    install(dataSetId: Id, htmlCode: string): Promise<void>;
}
