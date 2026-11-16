## 1. Domain

-   [x] 1.1 [BE] Add the periods allow-list and `SectionPeriod` types in `src/domain/common/entities/SectionPeriodsConfig.ts`
-   [x] 1.2 [BE] Validate periods in `SaveFormConfigUseCase`
-   [x] 1.3 [BE] Move the rules formula config type into the domain (`RulesFormulaConfig.ts`), so `AutogenConfig.ts` does not import from `data/`
-   [x] 1.4 [BE] Unit test the allow-list and the use case
-   [x] 1.5 [BE] Return issues with a level: a `relative-interval` that does not apply is an error, a `section-offset` on a view type without periods is a warning
-   [x] 1.6 [BE] Type stored `periods` as `SectionPeriod` in `AutogenConfig`, so the domain does not parse unknown values

## 2. Data

-   [x] 2.1 [BE] Return no interval periods for view types that are not interval view types
-   [x] 2.2 [BE] Write a console warning once per form load for an invalid periods config
-   [x] 2.3 [BE] Unit test `getSectionPeriods`

## 3. Configurator

-   [x] 3.1 [FE] Type `parseJson` as `Maybe<AutogenConfig>` and show an error when the user saves an empty configuration

## 4. Docs

-   [x] 4.1 Document the section periods support table in `README.md`
-   [x] 4.2 Add this delta spec
