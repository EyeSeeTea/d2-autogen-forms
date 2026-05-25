import { useEffect } from "react";
import { getTopAccessibleWindow } from "../../../utils/topAccessibleWindow";

/**
 * Injects style overrides into the topmost same-origin document so the new
 * DHIS2 Data Entry app shell (which wraps this iframe in a `formArea` div with
 * a hashed CSS-module class like `_formArea_gifug_16`) does not add unwanted
 * top spacing around the embedded form.
 */
export function useParentDataEntryAppStyles() {
    useEffect(() => {
        const win = getTopAccessibleWindow();
        if (win === window) return;

        const targetDoc = win.document;
        const head = targetDoc.head ?? targetDoc.documentElement;

        const style = targetDoc.createElement("style");
        style.setAttribute("data-autogen-forms-parent-overrides", "");
        style.appendChild(
            targetDoc.createTextNode(
                `[class*="formArea"] { margin-top: 0 !important; padding-top: 0 !important; gap: 0 !important; }`
            )
        );
        head.appendChild(style);

        return () => {
            style.remove();
        };
    }, []);
}
