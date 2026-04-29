import i18n from "@eyeseetea/d2-ui-components/locales";
import { Constant } from "../../../../domain/common/entities/Constant";
import { extractRootPrefix } from "./extractRootPrefix";
import { isInlineConstantCodePosition } from "./jsonPathAtCursor";
import { CodeEditor, CompletionItem, IRange, Monaco, Position, TextModel } from "./types";

export type CreateNewConstantTrigger = (args: { range: IRange; prefix: string }) => void;

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
    codeEditor: CodeEditor,
    monaco: Monaco,
    options: InlineConstantCompletionsOptions
): Disposer {
    const commandId = codeEditor.addCommand(
        0,
        (_context: unknown, args: { range: IRange; prefix: string }) => {
            options.onRequestCreate(args);
        }
    );

    const providerDisposable = monaco.languages.registerCompletionItemProvider("json", {
        triggerCharacters: ['"', "_"],
        provideCompletionItems: async (model: TextModel, position: Position) => {
            if (model !== codeEditor.getModel()) return { suggestions: [] };

            const fullText = model.getValue();
            const offset = model.getOffsetAt(position);
            if (!isInlineConstantCodePosition(fullText, offset)) return { suggestions: [] };

            const prefix = extractRootPrefix(fullText);
            const word = model.getWordUntilPosition(position);
            const range: IRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const fetchResult = await options
                .fetchConstants(prefix)
                .then(constants => ({ ok: true as const, constants }))
                .catch(error => ({ ok: false as const, error }));

            if (!fetchResult.ok) {
                console.error("Failed to load constants for inline completions", fetchResult.error);
                return { suggestions: [buildFetchErrorItem(range, monaco), buildCreateNewItem({ range, prefix, monaco, canCreate: options.canCreate, commandId })] };
            }

            const existingItems = fetchResult.constants.map((constant, index) =>
                buildExistingItem(constant, range, index, monaco)
            );
            const createItem = buildCreateNewItem({
                range,
                prefix,
                monaco,
                canCreate: options.canCreate,
                commandId,
            });

            return { suggestions: [createItem, ...existingItems] };
        },
    });

    let wasEligible = false;
    const cursorDisposable = codeEditor.onDidChangeCursorPosition(() => {
        const model = codeEditor.getModel();
        const position = codeEditor.getPosition();
        if (!model || !position) {
            wasEligible = false;
            return;
        }
        const offset = model.getOffsetAt(position);
        const isEligible = isInlineConstantCodePosition(model.getValue(), offset);
        if (isEligible && !wasEligible) {
            setTimeout(() => {
                codeEditor.trigger("inline-constants", "editor.action.triggerSuggest", {});
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

function buildExistingItem(constant: Constant, range: IRange, index: number, monaco: Monaco): CompletionItem {
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
    range: IRange;
    prefix: string;
    monaco: Monaco;
    canCreate: boolean;
    commandId: string | null;
}): CompletionItem {
    const { range, prefix, monaco, canCreate, commandId } = params;
    const label = i18n.t("Create new constant");
    const base: CompletionItem = {
        label,
        kind: monaco.languages.CompletionItemKind.Event,
        insertText: "",
        range,
        sortText: "0",
        detail: canCreate
            ? i18n.t("Open dialog to define a new constant")
            : i18n.t("Requires F_CONSTANT_ADD authority"),
    };

    if (canCreate && commandId) {
        return { ...base, command: { id: commandId, title: label, arguments: [{ range, prefix }] } };
    }

    return { ...base, tags: [monaco.languages.CompletionItemTag.Deprecated] };
}

function buildFetchErrorItem(range: IRange, monaco: Monaco): CompletionItem {
    return {
        label: i18n.t("Failed to load constants"),
        kind: monaco.languages.CompletionItemKind.Text,
        insertText: "",
        range,
        sortText: "z",
        detail: i18n.t("Check the network and try again"),
        tags: [monaco.languages.CompletionItemTag.Deprecated],
    };
}
