export function getTopAccessibleWindow(): Window {
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
    return win;
}
