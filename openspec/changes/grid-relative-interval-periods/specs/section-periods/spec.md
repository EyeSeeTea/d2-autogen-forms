## ADDED Requirements

### Requirement: Periods config by view type

The form SHALL accept a `relative-interval` only on the interval view types: `grid-with-periods`, `grid-indicators-calculated` and `grid-with-cat-option-combos`. The form SHALL accept a `section-offset` on the interval view types, `grid` and `table`. All other view types SHALL ignore `periods`. `grid` and `table` render `periods[0]` only, so an interval does not apply to them.

#### Scenario: Section without a view type

-   **WHEN** a section has no `viewType` and the dataset has no `viewType`
-   **THEN** the form SHALL apply the `table` rules to its `periods` config

#### Scenario: Relative interval on a single-period view type

-   **WHEN** a `grid` or `table` section has a `relative-interval` periods config
-   **THEN** the section SHALL use the dataset period
-   **AND** the form SHALL write a warning in the browser console

#### Scenario: Section offset on a single-period view type

-   **WHEN** a `grid` or `table` section has `{ "type": "section-offset", "offset": -1 }` and the dataset period is `2025`
-   **THEN** the section SHALL use the period `2024`

#### Scenario: Relative interval on an interval view type

-   **WHEN** a `grid-with-periods` section has `{ "type": "relative-interval", "startOffset": -2, "endOffset": 0 }` and the dataset period is `2025`
-   **THEN** the section SHALL show the periods `2023`, `2024` and `2025`

### Requirement: Configurator checks the periods config on save

`SaveFormConfigUseCase` SHALL NOT save a config that has a `relative-interval` that does not apply to the section view type. It SHALL save a config that has only a `section-offset` on a view type without periods. The error message SHALL name each invalid section and its view type.

#### Scenario: Relative interval on a grid

-   **WHEN** the user saves a config with a `grid` section that has a `relative-interval`
-   **THEN** the configurator SHALL NOT save the config
-   **AND** the configurator SHALL show an error that names the section and suggests `grid-with-periods` or `section-offset`

#### Scenario: Section offset on a view type without periods

-   **WHEN** the user saves a config with a `matrix-grid` section that has a `section-offset`
-   **THEN** the configurator SHALL save the config
-   **AND** the form SHALL write a warning in the browser console when it loads the section
