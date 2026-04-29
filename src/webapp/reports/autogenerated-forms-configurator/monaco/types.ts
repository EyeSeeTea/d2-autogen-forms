// Minimal structural interfaces for the subset of monaco-editor we use.
// monaco-editor itself is not installed as a package — it is loaded at runtime
// by @monaco-editor/react's loader. These types let us replace `any` in our
// own code without taking on monaco-editor as a devDependency.

import type { Monaco } from "@monaco-editor/react";

export type { Monaco };

export type IRange = {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
};

export type Position = {
    readonly lineNumber: number;
    readonly column: number;
};

export type WordAtPosition = {
    word: string;
    startColumn: number;
    endColumn: number;
};

export type TextModel = {
    getValue(): string;
    getOffsetAt(position: Position): number;
    getWordUntilPosition(position: Position): WordAtPosition;
    getLineContent(line: number): string;
};

export type CodeEditor = {
    getModel(): TextModel | null;
    getPosition(): Position | null;
    addCommand(keybinding: number, handler: (...args: any[]) => void, context?: string): string | null;
    onDidChangeCursorPosition(listener: () => void): { dispose(): void };
    onDidChangeModelContent(listener: () => void): { dispose(): void };
    onKeyUp(listener: (e: { keyCode: number }) => void): { dispose(): void };
    trigger(source: string, handlerId: string, payload?: unknown): void;
    executeEdits(
        source: string,
        edits: ReadonlyArray<{ range: IRange; text: string; forceMoveMarkers?: boolean }>
    ): boolean;
    focus(): void;
    updateOptions(options: Record<string, unknown>): void;
};

export type CompletionItem = {
    label: string;
    kind: number;
    insertText: string;
    range: IRange;
    detail?: string;
    documentation?: string;
    sortText?: string;
    tags?: number[];
    command?: { id: string; title: string; arguments?: unknown[] };
};

export type CompletionList = {
    suggestions: CompletionItem[];
};
