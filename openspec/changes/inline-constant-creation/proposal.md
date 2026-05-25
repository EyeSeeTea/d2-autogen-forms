## Why

Text fields in the Autogen Configurator accept either a literal string or a constant reference (`{ "code": "..." }`). Projects that need translations rely almost exclusively on constants, but creating one today forces the user to leave the Configurator, open the DHIS2 Maintenance app, create the constant, copy the code, return, and paste it in — high friction, and typos in the pasted code silently break the form. The fix: when the cursor lands on a `code` string in a `texts` block, Monaco's autocomplete contributes a "Create new constant" entry that opens an inline dialog and inserts the saved constant's code into the editor on success.

## What Changes

-   Register a Monaco `CompletionItemProvider` scoped to any `code` property nested under a `texts` object (`texts.header.code`, `texts.footer.code`, `texts.rowTotals.code`, etc.). The provider contributes a single entry: "Create new constant".
-   Selecting the entry opens a new `CreateConstantDialog`.
-   `CreateConstantDialog` fields: `name` (required), `shortName` (required, auto-filled from name, editable, max 50 chars), `code` (required, auto-filled from name, editable), `description` (required). The `value` field is not shown — the dialog always submits `value: 0` (numeric value is irrelevant for translation-key constants). `translations: []` is submitted today; per-locale translation entry is a follow-up.
-   On successful save the new constant's `code` is written back into the editor at the original cursor position. On failure the dialog stays open with an inline error.
-   Tag the "Create new constant" entry as deprecated (and disable the dialog's "Save" action) when the current user lacks the DHIS2 authority `F_CONSTANT_ADD`.
-   On large configurations (`isLargeFile === true`), Monaco's JSON-worker `completionItems` contribution is disabled so the create entry isn't drowned out by the document-string scraper.

## Capabilities

### New Capabilities

-   `inline-constant-creation`: a Monaco-integrated entry point for creating a DHIS2 constant inline from any `texts.*.code` cursor position.

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

-   **Domain layer**: `Constant` entity already matched the DHIS2 shape and is the only type used throughout. New entries are represented by a `Constant` with `id: ""` and `translations: []`. New `CreateConstantUseCase.execute(constant)` returns `Promise<void>` and wraps `ConstantRepository.save([constant], { post: true, export: false })`. `ConstantSaveError` is a tagged discriminated type carrying structured `ErrorReportEntry[]` so per-field errors survive to the UI.
-   **Data layer**: `ConstantRepository` exposes only `save(constants, options)`. `save` internally splits the input array on `id === ""` — new entries are POSTed without an `id` field (DHIS2 assigns the UID server-side); existing entries keep the pre-fetch-then-merge flow.
-   **Webapp layer**: new Monaco completion provider registered in `Editor.tsx`. New `CreateConstantDialog` with a `useCreateConstantForm` hook owning state, validation, and save. `Editor.tsx` disables the JSON-worker `completionItems` contribution while `isLargeFile` is `true`.
-   **Composition root**: wire `CreateConstantUseCase`.
-   **Permissions**: read `F_CONSTANT_ADD` from the current user's authorities (already exposed by `@eyeseetea/d2-api`); gate the "Create new constant" completion item.
-   **Build**: no change to `gulp build-report` — configurator-only feature.
-   **Dependencies**: no new external dependencies.
