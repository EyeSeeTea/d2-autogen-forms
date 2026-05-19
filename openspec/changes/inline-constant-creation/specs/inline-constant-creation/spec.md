## ADDED Requirements

### Requirement: Autocomplete for `code` fields nested under `texts`

The Configurator SHALL provide Monaco autocomplete suggestions whenever the cursor is positioned on a string value of a property named `code` that is nested (at any depth) under a property named `texts`. The `code` property MUST be nested under an intermediate object (e.g., `texts.header.code`, `texts.rowTotals.code`); a direct `texts.code` is not eligible.

#### Scenario: Cursor on `texts.header.code`

-   **WHEN** the cursor is inside the string value of `texts.header.code` in the JSON editor
-   **THEN** the Monaco suggest widget SHALL open with a single "Create new constant" entry

#### Scenario: Cursor on a non-`texts` `code` field

-   **WHEN** the cursor is inside the string value of a `code` property that is NOT nested under `texts` (e.g., `dataElement.code`)
-   **THEN** the Configurator SHALL NOT contribute inline-constant-creation suggestions

#### Scenario: Cursor on a deeply nested `code` under `texts`

-   **WHEN** the cursor is inside `texts.rowTotals.code` or any other `texts.*.code` path at any depth
-   **THEN** the autocomplete SHALL behave the same as for top-level `texts.header.code`

### Requirement: Create-new entry in autocomplete

The autocomplete SHALL contribute a single "Create new constant" entry whenever it is eligible.

#### Scenario: Entry is the only contribution

-   **WHEN** the autocomplete opens on an eligible field
-   **THEN** the inline-constant-creation provider SHALL contribute exactly one entry: "Create new constant"

#### Scenario: User selects "Create new constant"

-   **WHEN** the user selects the "Create new constant" entry
-   **THEN** the Create Constant dialog SHALL open
-   **AND** the cursor position at the time of selection SHALL be recorded for later insertion

### Requirement: Create Constant dialog fields

The Create Constant dialog SHALL collect: `name` (required), `shortName` (required, max 50 characters), `code` (required), and `description` (required). The dialog SHALL additionally emit `id: ""` (DHIS2 will assign it on save), `value: 0` (fixed — the numeric value is not meaningful for translation-key constants and is not editable in the UI), and `translations: []` (translation entry is deliberately out of scope for this change and will be added in a follow-up).

#### Scenario: `shortName` auto-derivation

-   **WHEN** the user types a `name` in the dialog and has not manually edited the `shortName` field
-   **THEN** `shortName` SHALL be auto-filled as the upper-snake-case of `name`, truncated to 50 characters

#### Scenario: `code` auto-derivation

-   **WHEN** the user types a `name` and has not manually edited the `code` field
-   **THEN** `code` SHALL be auto-filled as the upper-snake-case of `name` (no prefix, no truncation)

#### Scenario: User overrides an auto-derived field

-   **WHEN** the user manually edits `shortName` or `code`
-   **THEN** subsequent changes to `name` SHALL NOT overwrite the manually-edited field

#### Scenario: Value is fixed at zero

-   **WHEN** the Create Constant dialog saves a new constant
-   **THEN** the submitted constant SHALL have `value: 0` regardless of any other input (no `value` field is shown in the UI)

### Requirement: Constant persistence via DHIS2 API

On dialog save, the system SHALL persist the new constant to DHIS2 metadata via `ConstantRepository.save([constant], { post: true, export: false })`, where `constant.id === ""` signals "new entry" and `constant.translations === []` (DHIS2 assigns the UID server-side).

#### Scenario: Successful creation inserts code in editor

-   **WHEN** the dialog is saved and the DHIS2 API confirms the constant was created
-   **THEN** the editor SHALL replace the string value at the recorded cursor position with the new `code`
-   **AND** the dialog SHALL close

#### Scenario: Duplicate code

-   **WHEN** the DHIS2 API rejects creation because the `code` already exists
-   **THEN** the dialog SHALL remain open and display an inline error identifying the duplicate code field

#### Scenario: API failure

-   **WHEN** the DHIS2 API returns any other error during creation
-   **THEN** the dialog SHALL remain open and display the error message
-   **AND** the editor content SHALL be unchanged

### Requirement: Permission gating for constant creation

The "Create new constant" affordance SHALL be gated on the current user holding the DHIS2 authority `F_CONSTANT_ADD`.

#### Scenario: User lacks `F_CONSTANT_ADD`

-   **WHEN** the current user does not hold the `F_CONSTANT_ADD` authority
-   **THEN** the "Create new constant" autocomplete entry SHALL be marked deprecated with an explanatory hover message
-   **AND** the Create Constant dialog cannot be opened

#### Scenario: User holds `F_CONSTANT_ADD`

-   **WHEN** the current user holds the `F_CONSTANT_ADD` authority
-   **THEN** the "Create new constant" entry SHALL be selectable and opens the dialog

### Requirement: Large-file mode compatibility

Inline constant creation SHALL remain fully functional when the Configurator is in large-file mode (JSON schema validation disabled). To prevent Monaco's JSON-worker `completionItems` contribution from flooding the suggest widget on large files, the Configurator SHALL disable that contribution while `isLargeFile` is `true`.

#### Scenario: Large configuration file

-   **WHEN** the loaded configuration exceeds 100 KB and `isLargeFile` is `true`
-   **THEN** the autocomplete provider SHALL still open on eligible `texts.*.code` fields
-   **AND** creation SHALL still insert the new code into the editor on success
