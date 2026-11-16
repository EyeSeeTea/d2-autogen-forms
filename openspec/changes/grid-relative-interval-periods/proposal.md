## Why

A `grid` or `grid-with-totals` section with a `relative-interval` periods config crashed the form. `getRelativeIntervalPeriodsByViewType` did not handle these view types and threw `Unsupported viewType`. A `table` section with a `relative-interval` did not crash, but it read and wrote the first period of the interval, not the dataset period. The user did not get a warning.

## Goals

-   Stop the crash for `grid` and `grid-with-totals`.
-   Make `grid` and `table` use the dataset period when the config has a `relative-interval`, as before v1.4.0.
-   Reject a `relative-interval` that does not apply to the view type when the configurator saves.
-   Warn about a `section-offset` on a view type without periods, but do not block the save.

## Non-goals

-   Add `section-offset` support to `grid-with-totals`.
-   Fix `getDailyPeriods` across DST changes or `getWeeklyPeriods` for 52-week years. Track these separately.

## What Changes

-   An allow-list in the domain (`SectionPeriodsConfig.ts`) sets which view types accept which `periods` type:
    -   Interval view types (`grid-with-periods`, `grid-indicators-calculated`, `grid-with-cat-option-combos`): `relative-interval` and `section-offset`.
    -   Single-period view types (`grid`, `table`): `section-offset` only.
    -   All other view types: no `periods`.
-   The form ignores a `periods` value that does not apply and writes a console warning.
-   `SaveFormConfigUseCase` rejects a `relative-interval` that does not apply and returns one message for each invalid section. A `section-offset` on a view type without periods is a warning only.
-   The domain gets typed `periods` (`SectionPeriod`). `AutogenConfig` now types stored sections with the stored `periods` config, not the resolved periods.
-   The configurator shows an error when the user saves an empty configuration.

## User impact

-   Forms with a `grid` or `grid-with-totals` section and a `relative-interval` load again.
-   A `table` section with a `relative-interval` now uses the dataset period, not the start of the interval.
-   A stored config that has a `relative-interval` that does not apply cannot be saved again until the user fixes it.

## Compatibility

The DataStore schema does not change. The codec still decodes the same `periods` shapes. Only the save-time validation and the period resolution change.

## Rollback plan

Revert the commit. No stored data changes, so no data migration is necessary.
