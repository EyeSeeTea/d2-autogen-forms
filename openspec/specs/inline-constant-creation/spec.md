## Purpose

Allow the Configurator user to create a DHIS2 constant inline while editing a `texts.*.code` value, without leaving the editor.

## Requirements

### Requirement: Autocomplete for `code` fields nested under `texts`

The Configurator SHALL provide Monaco autocomplete suggestions whenever the cursor is positioned on a string value of a property named `code` that is nested (at any depth) under a property named `texts`. A direct `texts.code` is not eligible — the `code` property must be nested under an intermediate object (e.g., `texts.header.code`, `texts.footer.code`, `texts.rowTotals.code`).

#### Scenario: Cursor on a `texts.*.code` value

-   **WHEN** the cursor is inside the string value of any `texts.*.code` path
-   **THEN** the Monaco suggest widget SHALL open and contribute a single "Create new constant" entry

#### Scenario: Cursor outside `texts.*.code`

-   **WHEN** the cursor is inside any string value that is not a `texts.*.code`
-   **THEN** the inline-constant-creation provider SHALL contribute no entries

### Requirement: Create Constant dialog fields

The Create Constant dialog SHALL collect: `name` (required), `shortName` (required, max 50 characters), `code` (required), and `description` (required). The dialog SHALL submit `id: ""` (DHIS2 assigns the UID server-side), `value: 0` (fixed; not editable), and `translations: []` (translation entry is a follow-up).

#### Scenario: Auto-derivation of `shortName` and `code` from `name`

-   **WHEN** the user types a `name` and has not manually edited `shortName` or `code`
-   **THEN** `shortName` SHALL be the upper-snake-case of `name`, truncated to 50 characters
-   **AND** `code` SHALL be the upper-snake-case of `name` (no truncation)

#### Scenario: Manual edits override auto-derivation

-   **WHEN** the user manually edits `shortName` or `code`
-   **THEN** subsequent changes to `name` SHALL NOT overwrite the manually-edited field

### Requirement: Constant persistence via DHIS2 API

On dialog save, the system SHALL POST the new constant to DHIS2 via `ConstantRepository.save([constant], { post: true, export: false })`. On success the editor inserts the new `code` at the recorded cursor position. On failure (duplicate code, validation error, network error) the dialog stays open and surfaces the error.

#### Scenario: Successful creation

-   **WHEN** the API confirms the constant was created
-   **THEN** the editor SHALL insert the new `code` at the recorded cursor position
-   **AND** the dialog SHALL close

#### Scenario: Per-field error from the API

-   **WHEN** the API returns a typed error attributable to a specific field (e.g., duplicate `code`)
-   **THEN** the dialog SHALL remain open and surface the message under the matching form field

#### Scenario: General error from the API

-   **WHEN** the API returns an error not attributable to a specific field
-   **THEN** the dialog SHALL remain open and surface the message at the top of the form
-   **AND** the editor content SHALL be unchanged

### Requirement: Permission gating

The "Create new constant" affordance SHALL be gated on the current user holding the DHIS2 authority `F_CONSTANT_ADD` (or `ALL`).

#### Scenario: User lacks the authority

-   **WHEN** the current user does not hold `F_CONSTANT_ADD`
-   **THEN** the autocomplete entry SHALL be marked deprecated with the message "Requires F_CONSTANT_ADD authority"
-   **AND** selecting it SHALL be a no-op

### Requirement: Large-file mode compatibility

Inline constant creation SHALL function on configurations of any size. On configurations classified as large (`isLargeFile` is `true`, i.e., size > 100 KB), the Configurator SHALL disable Monaco's JSON-worker `completionItems` contribution to keep the suggest widget focused on the create entry.

#### Scenario: Large configuration file

-   **WHEN** `isLargeFile` is `true`
-   **THEN** the autocomplete provider SHALL still open on eligible `texts.*.code` fields
-   **AND** the JSON-worker SHALL NOT contribute additional suggestions
