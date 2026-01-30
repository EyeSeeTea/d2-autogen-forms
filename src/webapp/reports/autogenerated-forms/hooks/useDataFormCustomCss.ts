import { useEffect } from "react";
import { DataForm } from "../../../../domain/common/entities/DataForm";

async function sanitizeCss(cssText: string): Promise<string | null> {
    const sheet = new CSSStyleSheet();

    try {
        // @ts-ignore `replace` is supported in modern browsers but not in current types
        await sheet.replace(cssText);
    } catch {
        console.warn("Failed to parse custom CSS.", { cssText });
        return null;
    }

    let sanitized = "";
    for (const rule of Array.from(sheet.cssRules)) {
        sanitized += rule.cssText + "\n";
    }

    return sanitized.trim() || null;
}

export function useDataFormCustomCss(dataForm?: DataForm) {
    useEffect(() => {
        const dataSetId = dataForm?.id;
        if (!dataSetId) return;

        const styleId = `data-set-custom-css-${dataSetId}`;
        const existing = document.getElementById(styleId);
        if (existing) existing.remove();

        const customCss = dataForm?.customCss;
        if (!customCss) return;

        let style: HTMLStyleElement | null = null;
        let cancelled = false;

        (async () => {
            const sanitizedCss = await sanitizeCss(customCss);
            if (!sanitizedCss || cancelled) return;

            const scopeSelector = `@scope([data-autogen-form-id="${dataSetId}"])`;
            const scopedCss = `${scopeSelector} {\n${sanitizedCss}\n}\n`;

            style = document.createElement("style");
            style.setAttribute("id", styleId);
            style.appendChild(document.createTextNode(scopedCss));
            document.head.appendChild(style);
        })();

        return () => {
            cancelled = true;
            if (style) style.remove();
        };
    }, [dataForm?.customCss, dataForm?.id]);
}
