import { Id } from "../../../../domain/common/entities/Base";
import { Maybe } from "../../../../utils/ts-utils";

/**
 * Adapter over `window.dhis2.shim`, the bridge that the Legacy Custom Forms plugin of the DHIS2
 * Data Entry app (>= 102.0.0) exposes to custom forms containing JavaScript. It lets the form tell
 * the app shell which cell is selected, so the "View details" side panel follows the selection, and
 * ask the shell to open that panel.
 *
 */

type DataEntryShim = NonNullable<NonNullable<Window["dhis2"]>["shim"]>;

export type HighlightedField = Readonly<{ dataElementId: Id; categoryOptionComboId: Id }>;

export function isDataEntryShimAvailable(): boolean {
    return Boolean(window.dhis2?.shim);
}

/**
 * Marks a cell as the selected one in the app shell. Pass `undefined` to clear the selection.
 *
 * Note this is not called on blur, mirroring the native cells: the details panel lives outside the
 * form, so clearing the selection when the input loses focus would empty the panel as soon as the
 * user interacts with it.
 */
export function highlightDataEntryField(field: Maybe<HighlightedField>): void {
    withShim(shim => shim.setHighlightedField?.(field ?? null));
}

/** Opens the "View details" side panel, which renders the currently highlighted cell. */
export function showDataEntryDetails(): void {
    withShim(shim => shim.showDetailsBar?.());
}

function withShim(action: (shim: DataEntryShim) => void): void {
    const shim = window.dhis2?.shim;
    if (!shim) return;

    try {
        action(shim);
    } catch (error) {
        console.warn("[autogen-forms] Call to the Data Entry app shim failed", error);
    }
}
