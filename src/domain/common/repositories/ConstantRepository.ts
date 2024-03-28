import { Constant } from "../entities/Constant";
import { SaveOptions } from "../entities/SaveOptions";
import { Stats } from "../entities/Stats";

export interface ConstantRepository {
    get(): Promise<Constant[]>;
    save(constants: Constant[], options: SaveOptions): Promise<Stats>;
}
