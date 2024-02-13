import { Constant } from "../entities/Constant";

export interface ImportConstantRepository {
    import(path: string): Constant[];
}
