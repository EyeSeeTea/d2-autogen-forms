import { Code } from "./Base";

// Matches the shape that rulesFormulaCodec (data layer) decodes from the dataStore.
export type RulesFormulaConfig = Record<
    "visible" | "disabled" | "enabled",
    {
        formula: { value: string; condition: string };
        dataElements: Array<{ code: Code }>;
    }
>;
