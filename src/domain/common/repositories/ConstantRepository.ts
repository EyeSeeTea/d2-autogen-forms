import { Constant } from "../entities/Constant";
import { SaveOptions } from "../entities/SaveOptions";
import { Stats } from "../entities/Stats";

export interface ConstantRepository {
    get(prefix?: string): Promise<Constant[]>;
    save(constants: Constant[], options: SaveOptions): Promise<Stats>;
}
