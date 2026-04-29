import i18n from "@eyeseetea/d2-ui-components/locales";
import { Constant } from "../../../../domain/common/entities/Constant";
import { Maybe } from "../../../../utils/ts-utils";
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

export function registerInlineConstantCompletions(
    codeEditor: CodeEditor,
    monaco: Monaco,
    options: InlineConstantCompletionsOptions
): Disposer {
    const commandId = codeEditor.addCommand(0, (_accessor: unknown, ...args: unknown[]) => {
        const payload = args[0] as { range: IRange; prefix: string };
        options.onRequestCreate(payload);
    });

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
            const createItem = buildCreateNewItem({
                range,
                prefix,
                monaco,
                canCreate: options.canCreate,
                commandId,
            });

            // Without a prefix Monaco's fuzzy filter prunes the create entry against the
            // full constants list on large files, so list only the create entry.
            if (!prefix) {
                return { suggestions: [createItem] };
            }

            const fetchResult = await options
                .fetchConstants(prefix)
                .then(constants => ({ ok: true as const, constants }))
                .catch(error => ({ ok: false as const, error }));

            if (!fetchResult.ok) {
                console.error("Failed to load constants for inline completions", fetchResult.error);
                return { suggestions: [buildFetchErrorItem(range, monaco), createItem] };
            }

            const existingItems = fetchResult.constants.map((constant, index) =>
                buildExistingItem(constant, range, index, monaco)
            );

            return { suggestions: [createItem, ...existingItems] };
        },
    });

    let wasEligible = false;
    let pendingTrigger: Maybe<ReturnType<typeof setTimeout>>;
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
            pendingTrigger = setTimeout(() => {
                pendingTrigger = undefined;
                codeEditor.trigger("inline-constants", "editor.action.triggerSuggest", {});
            }, 0);
        }
        wasEligible = isEligible;
    });

    return {
        dispose: () => {
            if (pendingTrigger !== undefined) {
                clearTimeout(pendingTrigger);
                pendingTrigger = undefined;
            }
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
    commandId: Maybe<string>;
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
