import React, { useContext } from "react";
import { CompositionRoot } from "../../compositionRoot";
import { Config } from "../../domain/common/entities/Config";
import { D2Api } from "../../types/d2-api";
import i18n from "../../locales";

export interface AppContextState {
    api: D2Api;
    config: Config;
    compositionRoot: CompositionRoot;
}

export const AppContext = React.createContext<AppContextState | null>(null);

export function useAppContext() {
    const context = useContext(AppContext);
    i18n.setDefaultNamespace("d2-autogen-forms");
    if (context) {
        return context;
    } else {
        throw new Error("App context uninitialized");
    }
}
