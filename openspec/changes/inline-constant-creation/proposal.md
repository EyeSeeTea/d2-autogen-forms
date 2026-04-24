## Why

Text fields in the Autogen Configurator accept either a literal string or a constant reference (`{ "code": "..." }`). Projects that need translations rely almost exclusively on constants, but creating one today forces the user to leave the Configurator, open the DHIS2 Maintenance app, create the constant, copy the code, return, and paste it in — high friction, and typos in the pasted code silently break the form. The ClickUp mockup (see `openspec/designs/exports/image.png`) shows the intended fix: when the cursor lands on a `code` string in a `texts` block, Monaco's autocomplete opens with the existing constants for this dataset plus a "➕ Create new constant" entry at the top.

## What Changes

- Add an optional `prefix` field at the **root** of the DataStore configuration (applies globally to every dataset in the namespace). Constants are filtered to those whose `code` starts with this prefix, and newly-created constants receive this prefix automatically.
- Register a Monaco `CompletionItemProvider` scoped to any `code` property nested under a `texts` object (`texts.header.code`, `texts.footer.code`, `texts.rowTotals.code`, etc.). The provider lists existing DHIS2 constants filtered by `prefix`, with a top entry labelled "➕ Create new constant".
- Selecting an existing constant inserts its `code` at the cursor; selecting the top entry opens a new `CreateConstantDialog`.
- `CreateConstantDialog` fields: `name` (required), `shortName` (required, auto-filled from name, editable, max 50 chars), `code` (required, prefix pre-filled), `description` (required). The `value` field is not shown — the dialog always submits `value: 0` (numeric value is irrelevant for translation-key constants).
- On successful save the new constant's `code` is written back into the editor at the original cursor position. On failure the dialog stays open with an inline error.
- Hide/disable the "Create new constant" entry and dialog "Save" action when the current user lacks the DHIS2 authority `F_CONSTANT_ADD`.
- Custom completion provider keeps working in large-file mode (where Monaco's JSON schema validation is disabled).

## Capabilities

### New Capabilities

- `inline-constant-creation`: Monaco-integrated autocomplete for `texts.*.code` fields, with prefix-based filtering of existing DHIS2 constants and an inline dialog for creating a new constant without leaving the Configurator.

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- **DataStore config schema**: new optional `prefix: string` field at the **root** of the config object. Backwards-compatible — existing configs without a `prefix` fall back to listing all constants and creating unprefixed codes.
- **Domain layer**: `Constant` entity already matched the DHIS2 shape and is the only type used throughout. New entries are represented by a `Constant` with `id: ""` and `translations: []` (translations deliberately left empty for now; revisit later). New `CreateConstantUseCase.execute(constant)` returns `Promise<void>` and wraps `ConstantRepository.save([constant], { post: true, export: false })`.
- **Data layer**: `ConstantRepository.get(prefix?)` adds an optional prefix filter (no separate `listByPrefix`). `ConstantRepository.save` internally splits the input array on `id === ""` — new entries are POSTed without an `id` field (DHIS2 assigns the UID server-side); existing entries keep the pre-fetch-then-merge flow. DataStore codec updated for root `prefix`.
- **Webapp layer**: new Monaco completion provider registered in `useAutogenEditor`. New `CreateConstantDialog` component. Existing-constants list fetched via `ConstantRepository.get` filtered by prefix.
- **Composition root**: wire `CreateConstantUseCase`.
- **Permissions**: read `F_CONSTANT_ADD` from the current user's authorities (already exposed by `@eyeseetea/d2-api`); gate the "Create new" completion item.
- **Build**: no change to `gulp build-report` — configurator-only feature.
- **Dependencies**: no new external dependencies.
