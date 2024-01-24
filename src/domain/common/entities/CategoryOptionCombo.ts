import { Id } from "./Base";

export const DEFAULT_CATEGORY_OPTION_COMBO_CODE = "default";

export type CategoryOptionCombo = {
    id: Id;
    name: string;
    shortName: string | undefined;
};
