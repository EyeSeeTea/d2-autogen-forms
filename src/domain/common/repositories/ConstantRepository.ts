import { Code } from "../entities/Base";
import { Constant } from "../entities/Constant";
import { SaveOptions } from "../entities/SaveOptions";
import { Stats } from "../entities/Stats";

export interface ConstantRepository {
    get(): Promise<Code[]>;
    save(constants: Constant[], options: SaveOptions): Promise<Stats>;
}
