import type { Monaco } from "@monaco-editor/react";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { Constant } from "../../../../domain/common/entities/Constant";
import { extractRootPrefix } from "./extractRootPrefix";
import { isInlineConstantCodePosition } from "./jsonPathAtCursor";

type MonacoRange = {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
};

export type CreateNewConstantTrigger = (args: { range: MonacoRange; prefix: string }) => void;

export type InlineConstantCompletionsOptions = {
    fetchConstants: (prefix: string) => Promise<Constant[]>;
    canCreate: boolean;
    onRequestCreate: CreateNewConstantTrigger;
};

type Disposer = { dispose: () => void };

/**
 * Registers a Monaco CompletionItemProvider that fires on `texts.*.code`
 * string values. The list contains existing constants (filtered by the
 * root `prefix` in the current JSON) with a "Create new constant"
 * entry at the top.
 *
 * Selecting an existing constant replaces the typed fragment with its code.
 * Selecting "Create new constant" fires the provided callback with the
 * cursor range; the caller opens its dialog and, on success, inserts the
 * new code via `editor.executeEdits`.
 *
 * Returns a disposer that must be called on unmount.
 */
export function registerInlineConstantCompletions(
    monacoEditor: Monaco["editor"] extends { getModel: () => infer _M } ? any : any,
    monaco: Monaco,
    options: InlineConstantCompletionsOptions
): Disposer {
    const commandId = `inline-constants.createNew.${Math.random().toString(36).slice(2)}`;
    const registeredCommandId = monacoEditor.addCommand(
        0,
        (_context: unknown, args: { range: MonacoRange; prefix: string }) => {
            options.onRequestCreate(args);
        }
    );

    const providerDisposable = monaco.languages.registerCompletionItemProvider("json", {
        triggerCharacters: ['"', "_"],
        provideCompletionItems: async (model: any, position: any) => {
            if (model !== monacoEditor.getModel()) return { suggestions: [] };

            const fullText: string = model.getValue();
            const offset: number = model.getOffsetAt(position);
            if (!isInlineConstantCodePosition(fullText, offset)) return { suggestions: [] };

            const prefix = extractRootPrefix(fullText);
            const word = model.getWordUntilPosition(position);
            const range: MonacoRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const constants = await options.fetchConstants(prefix).catch(() => [] as Constant[]);
            const existingItems = constants.map((constant, index) => buildExistingItem(constant, range, index, monaco));

            const createItem = buildCreateNewItem({
                range,
                prefix,
                monaco,
                canCreate: options.canCreate,
                commandId: registeredCommandId ?? commandId,
            });

            return { suggestions: [createItem, ...existingItems] };
        },
    });

    let wasEligible = false;
    const cursorDisposable = monacoEditor.onDidChangeCursorPosition(() => {
        const model = monacoEditor.getModel();
        const position = monacoEditor.getPosition();
        if (!model || !position) {
            wasEligible = false;
            return;
        }
        const offset = model.getOffsetAt(position);
        const isEligible = isInlineConstantCodePosition(model.getValue(), offset);
        if (isEligible && !wasEligible) {
            setTimeout(() => {
                monacoEditor.trigger("inline-constants", "editor.action.triggerSuggest", {});
            }, 0);
        }
        wasEligible = isEligible;
    });

    return {
        dispose: () => {
            providerDisposable.dispose();
            cursorDisposable?.dispose();
        },
    };
}

function buildExistingItem(constant: Constant, range: MonacoRange, index: number, monaco: Monaco): any {
    return {
        label: constant.code,
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: constant.code,
        range,
        detail: constant.name,
        documentation: constant.description || undefined,
        sortText: `1_${String(index).padStart(6, "0")}`,
    };
}

function buildCreateNewItem(params: {
    range: MonacoRange;
    prefix: string;
    monaco: Monaco;
    canCreate: boolean;
    commandId: string;
}): any {
    const { range, prefix, monaco, canCreate, commandId } = params;
    const label = i18n.t("Create new constant");
    const base = {
        label,
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "",
        range,
        sortText: "0",
        detail: canCreate
            ? i18n.t("Open dialog to define a new constant")
            : i18n.t("Requires F_CONSTANT_ADD authority"),
    };

    if (canCreate) {
        return { ...base, command: { id: commandId, title: label, arguments: [{ range, prefix }] } };
    }

    return { ...base, tags: [monaco.languages.CompletionItemTag.Deprecated] };
}
