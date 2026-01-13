import React, { useEffect } from "react";
import { removePrefixFromWords } from "../../../../utils/string";

type OnRunValidationCallback = (table: Element, disconnect: () => void, reconnect: () => void) => void;

/**
 * Hook that observes changes to the #listTable inside the #validationDiv popup
 * This is the dataEntry app popup that opens when clicking "Run validations"
 */
export function useOnRunValidation(onRunValidation?: OnRunValidationCallback) {
    useEffect(() => {
        if (!onRunValidation) return;

        const validationDiv = document.querySelector("#validationDiv");
        if (!validationDiv) return;

        let observer: MutationObserver | null = null;

        const startObserving = () => {
            if (observer) return;

            observer = new MutationObserver(() => {
                const listTable = document.querySelector("#validationDiv .listTable");
                if (listTable) {
                    onRunValidation(listTable, disconnect, reconnect);
                }
            });

            observer.observe(validationDiv, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
            });
        };

        const disconnect = () => {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        };

        const reconnect = () => {
            disconnect();
            startObserving();
        };

        startObserving();

        return () => {
            disconnect();
        };
    }, [onRunValidation]);
}

/**
 * Removes the prefix from the DataEntry validation popup messages
 */
export function useRemovePrefixOnRunValidations(prefix: string) {
    const removePrefixCallback = React.useCallback<OnRunValidationCallback>(
        (table, disconnect, reconnect) => {
            if (!prefix) return;
            // disconnect/reconnect after changes to prevent infinite loop
            disconnect();

            const rows = table.querySelectorAll("tr");
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                const cell = cells[0];
                if (!cell) return;
                cell.textContent = removePrefixFromWords(cell.textContent ?? "", prefix);
            });

            reconnect();
        },
        [prefix]
    );

    useOnRunValidation(prefix ? removePrefixCallback : undefined);
}
