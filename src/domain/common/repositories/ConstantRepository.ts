import { Constant } from "../entities/Constant";
import { SaveOptions } from "../entities/SaveOptions";
import { Stats } from "../entities/Stats";

export interface ConstantRepository {
    save(constants: Constant[], options: SaveOptions): Promise<Stats>;
}
