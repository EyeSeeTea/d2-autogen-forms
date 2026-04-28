import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { StyleSheetManager } from "styled-components";
import { StylesProvider, jssPreset } from "@material-ui/core/styles";
import { create, Jss } from "jss";
import { getTopAccessibleWindow } from "../../utils/topAccessibleWindow";
import { Maybe } from "../../../utils/ts-utils";

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
type PortalTarget = { host: HTMLElement; mui: MuiProviders };

const muiProvidersCache = new WeakMap<Document, MuiProviders>();

export const IframeEscapePortal: React.FC<IframeEscapePortalProps> = ({
    hostId,
    hostStyles = DEFAULT_HOST_STYLES,
    children,
}) => {
    const [target, setTarget] = useState<Maybe<PortalTarget>>();
    const hostStylesRef = useRef(hostStyles);

    useEffect(() => {
        const targetDoc = getTopAccessibleWindow().document;
        const existingHost = targetDoc.getElementById(hostId);
        const host = existingHost ?? createHostElement(targetDoc, hostId, hostStylesRef.current);
        const mui = getOrCreateMuiProviders(targetDoc);
        setTarget({ host: host, mui: mui });

        return () => {
            if (!existingHost) host.remove();
        };
    }, [hostId]);

    if (!target) return null;

    const { host, mui } = target;
    const styleSheetTarget = host.ownerDocument.head ?? host.ownerDocument.documentElement;

    return ReactDOM.createPortal(
        <StyleSheetManager target={styleSheetTarget}>
            <StylesProvider jss={mui.jss} sheetsManager={mui.sheetsManager}>
                {children}
            </StylesProvider>
        </StyleSheetManager>,
        host
    );
};

function createHostElement(targetDoc: Document, hostId: string, styles: Partial<CSSStyleDeclaration>): HTMLElement {
    const element = targetDoc.createElement("div");
    element.id = hostId;
    Object.assign(element.style, styles);
    targetDoc.documentElement.appendChild(element);

    return element;
}

function getOrCreateMuiProviders(targetDoc: Document): MuiProviders {
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
}

const DEFAULT_HOST_STYLES = {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "999",
};
