## Why

A `grid` or `grid-with-totals` section with a `relative-interval` periods config crashed the form. `getRelativeIntervalPeriodsByViewType` did not handle these view types and threw `Unsupported viewType`.

## Goals

-   Stop the crash for `grid` and `grid-with-totals`.
-   Make `grid` use the dataset period when the config has a `relative-interval`, as before v1.4.0.
-   Keep the existing `table` behavior: a `table` with a `relative-interval` uses the period at `startOffset`. Warn when `endOffset` is different, because the table ignores it.
-   Reject a `relative-interval` that does not apply to the view type when the configurator saves.
-   Warn about a `section-offset` on a view type without periods, but do not block the save.

## Non-goals

-   Add `section-offset` support to `grid-with-totals`.
-   Fix `getDailyPeriods` across DST changes or `getWeeklyPeriods` for 52-week years. Track these separately.

## What Changes

-   An allow-list in the domain (`SectionPeriodsConfig.ts`) sets which view types accept which `periods` type:
    -   Interval view types (`grid-with-periods`, `grid-indicators-calculated`, `grid-with-cat-option-combos`): `relative-interval` and `section-offset`.
    -   First-period view types (`table`): `relative-interval` (only `startOffset` applies) and `section-offset`.
    -   Single-period view types (`grid`): `section-offset` only.
    -   All other view types: no `periods`.
-   The form ignores a `periods` value that does not apply and writes a console warning.
-   `SaveFormConfigUseCase` rejects a `relative-interval` that does not apply and returns one message for each invalid section. A `section-offset` on a view type without periods is a warning only.
-   The domain gets typed `periods` (`SectionPeriod`). `AutogenConfig` now types stored sections with the stored `periods` config, not the resolved periods.
-   The configurator shows an error when the user saves an empty configuration.

## User impact

-   Forms with a `grid` or `grid-with-totals` section and a `relative-interval` load again.
-   A `table` section with a `relative-interval` does not change: it uses the period at `startOffset`. If `endOffset` is different, the form writes a console warning.
-   A stored config that has a `relative-interval` that does not apply cannot be saved again until the user fixes it.

## Compatibility

The DataStore schema does not change. The codec still decodes the same `periods` shapes. Only the save-time validation and the period resolution change.

## Rollback plan

Revert the commit. No stored data changes, so no data migration is necessary.
