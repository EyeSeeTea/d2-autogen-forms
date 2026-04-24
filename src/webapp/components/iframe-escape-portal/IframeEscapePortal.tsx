import React, { useMemo } from "react";
import ReactDOM from "react-dom";
import { StyleSheetManager } from "styled-components";
import { StylesProvider, jssPreset } from "@material-ui/core/styles";
import { create, Jss } from "jss";

/**
 * Portals `children` into the topmost same-origin document and rewires styled-components
 * and MUI v4 style injection there so overlays render correctly when this form is
 * embedded in DHIS2's new data entry iframe (inside which `position: fixed` anchors to
 * the iframe viewport and style rules land in the iframe's <head>).
 */

type IframeEscapePortalProps = {
    hostId: string;
    hostStyles?: Partial<CSSStyleDeclaration>;
    children: React.ReactNode;
};

type MuiProviders = { jss: Jss; sheetsManager: Map<unknown, unknown> };

const muiProvidersCache = new WeakMap<Document, MuiProviders>();

export const IframeEscapePortal: React.FC<IframeEscapePortalProps> = ({
    hostId,
    hostStyles = DEFAULT_HOST_STYLES,
    children,
}) => {
    const host = useMemo<HTMLElement>(() => {
        let win: Window = window;
        try {
            while (win.parent && win.parent !== win) {
                const parentDoc = win.parent.document;
                if (!parentDoc) break;
                win = win.parent;
            }
        } catch {
            // Cross-origin ancestor — stop at the last accessible window.
        }
        const targetDoc = win.document;

        const existing = targetDoc.getElementById(hostId);
        if (existing) return existing;

        const element = targetDoc.createElement("div");
        element.id = hostId;
        Object.assign(element.style, hostStyles);
        targetDoc.documentElement.appendChild(element);

        return element;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hostId]); // hostStyles is intentionally omitted so a changing style object does not trigger this

    const { jss, sheetsManager } = useMemo<MuiProviders>(() => {
        const targetDoc = host.ownerDocument;
        const cached = muiProvidersCache.get(targetDoc);
        if (cached) return cached;

        const head = targetDoc.head ?? targetDoc.documentElement;
        const insertionPoint = targetDoc.createElement("style");
        insertionPoint.setAttribute("data-autogen-forms-jss", "");
        head.appendChild(insertionPoint);

        const providers: MuiProviders = {
            jss: create({ ...jssPreset(), insertionPoint }),
            sheetsManager: new Map(),
        };
        muiProvidersCache.set(targetDoc, providers);

        return providers;
    }, [host]);

    const styleSheetTarget = host.ownerDocument.head ?? host.ownerDocument.documentElement;

    return ReactDOM.createPortal(
        <StyleSheetManager target={styleSheetTarget}>
            <StylesProvider jss={jss} sheetsManager={sheetsManager}>
                {children}
            </StylesProvider>
        </StyleSheetManager>,
        host
    );
};

const DEFAULT_HOST_STYLES = {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "999",
};
