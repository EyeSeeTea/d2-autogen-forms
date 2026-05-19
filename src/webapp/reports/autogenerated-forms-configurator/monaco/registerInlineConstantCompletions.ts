import i18n from "@eyeseetea/d2-ui-components/locales";
import { Maybe } from "../../../../utils/ts-utils";
import { isInlineConstantCodePosition } from "./jsonPathAtCursor";
import { CodeEditor, CompletionItem, IRange, Monaco, Position, TextModel } from "./types";

export type CreateNewConstantTrigger = (args: { range: IRange }) => void;

export type InlineConstantCompletionsOptions = {
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
        const payload = args[0] as { range: IRange };
        options.onRequestCreate(payload);
    });

    const providerDisposable = monaco.languages.registerCompletionItemProvider("json", {
        triggerCharacters: ['"', "_"],
        provideCompletionItems: (model: TextModel, position: Position) => {
            if (model !== codeEditor.getModel()) return { suggestions: [] };

            const fullText = model.getValue();
            const offset = model.getOffsetAt(position);
            if (!isInlineConstantCodePosition(fullText, offset)) return { suggestions: [] };

            const word = model.getWordUntilPosition(position);
            const range: IRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            return { suggestions: [buildCreateNewItem({ range, monaco, canCreate: options.canCreate, commandId })] };
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

function buildCreateNewItem(params: {
    range: IRange;
    monaco: Monaco;
    canCreate: boolean;
    commandId: Maybe<string>;
}): CompletionItem {
    const { range, monaco, canCreate, commandId } = params;
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
        return { ...base, command: { id: commandId, title: label, arguments: [{ range }] } };
    }

    return { ...base, tags: [monaco.languages.CompletionItemTag.Deprecated] };
}
