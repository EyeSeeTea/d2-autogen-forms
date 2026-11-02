# Yarn Resolutions

This file documents every entry in the `resolutions` block of `package.json`, plus the findings that are accepted rather than fixed. Each entry answers three questions: **what is pinned**, **why it exists**, and **when it can be removed**.

`package.json` does not allow comments, so this file is where that knowledge lives. **If you add or remove a resolution, update this file in the same commit.**

## Conventions

- **A floor takes a `^` range; a fixture takes an exact version.** A floor means "never below this" (almost every security pin). A fixture means "exactly this" because something binds to that release (`i18next` below). An exact version where a floor belongs decays: nothing newer can ever land.
- **A floor names the highest patched version of every advisory it covers**, not the first one found.
- **Prefer re-resolution to a new constraint.** When the declared range already admits the patched release, `yarn up -R <package>` is enough and no resolution is needed.
- **Test a constraint by removing it, re-installing and comparing the resolved versions**, not the lockfile bytes. Every "without it" result below was measured that way on 2026-11-02 (Yarn 4.15.0): the entry was removed alone, `yarn install` was run on top of the current lockfile, and the resolved versions of that package were read from `yarn.lock`.
- **`npmMinimalAgeGate` stays at `7d`.** A fix newer than seven days is waited for, not forced through (see `joi` below).
- Advisory ranges were read from the GitHub advisory database (`gh api advisories`) on 2026-11-02. The CI gate follows Dependency-Track, which can disagree with `yarn npm audit` on severity, so do not mix counts from the two sources.

## Audit cadence

Re-audit monthly, before each release, and right before requesting review on a change that claims a clean gate: an advisory can be published or widened without the tree changing (two highs appeared on 2026-10-30 evening, after the remediation was measured). Run `yarn npm audit -R` over the whole tree, not only the packages named here. A finding that keeps coming back for a package that already has an entry means the entry stopped working.

---

## Active resolutions

### Compatibility fixtures

#### `i18next: 10.6.0`

- **Why:** `@dhis2/d2-i18n@1.1.0` (and the `1.0.6` copy under `@eyeseetea/d2-ui-components`) requests `i18next@^10.3`, while `i18next-scanner@2.11.0` (used by `extract-pot`) requests `*`. Without the entry the tree holds both `10.6.0` and `26.5.11`. The app must stay on the 10.x API: commit `99e9c87` ("i18next resolution crash") moved this entry from `19.8.5` to `10.6.0` after the newer line crashed the app. The earlier `22d41f0` message that mentions `19.8.5` is superseded by it.
- **Fixes:** Nothing. `10.6.0` has no advisory in the GitHub database; this is a compatibility pin, not a security one.
- **Drop when:** `@dhis2/d2-i18n` moves to a newer i18next and `yarn start` still works. Do not change it without running the app.

### Security pins

#### `axios: ^1.20.0`

- **Why:** `@eyeseetea/d2-api@1.16.0` requests `axios@1.6.4` exactly. Without the entry the tree holds `0.21.4`, `1.6.4` and `1.20.0`. Runtime dependency of the data-entry form, so changes are verified with a request through `D2Api` against a local server, not only with `yarn install`.
- **Fixes:** every axios advisory on the `1.x` line below `1.20.0`, including the highs GHSA-35jp-ww65-95wh and GHSA-3g43-6gmg-66jw. The previous exact pin `1.18.1` kept seven high advisories open; the floor is `1.20.0`.
- **Drop when:** no consumer requests `axios < 1.20`. Check with `yarn why axios -R`.

#### `lodash: ^4.18.0`

- **Why:** `@eyeseetea/d2-api@1.16.0` and `@eyeseetea/d2-ui-components@2.9.0` request `lodash@4.17.21` exactly. Without the entry the tree holds `4.17.21` and `4.18.1`.
- **Fixes:** GHSA-r5fr-rjxr-66jc (high, `_.template` code injection, `<= 4.17.23`) and the two medium prototype-pollution advisories on `<= 4.17.23`.
- **Note:** a floor, so patches land on re-resolution. The direct `dependencies` entry `lodash: 4.18.1` is still exact and was not touched.
- **Drop when:** `d2-api` and `d2-ui-components` stop pinning lodash exactly.

#### `qs: ^6.16.1`

- **Why:** `@eyeseetea/d2-api@1.16.0` requests `qs@6.9.7` exactly. Without the entry `6.9.7` stays next to `6.16.1`.
- **Fixes:** GHSA-4mjr-xmp4-gh2g, GHSA-6pq8-jhm2-2vcw, GHSA-6rw7-vpxm-498p, GHSA-w7fw-mjwx-w883 (all medium or low; the latest is fixed in `6.16.1`).
- **Drop when:** `d2-api` requests `qs >= 6.16.1`.

#### `loader-utils: ^1.4.2`

- **Why:** `styled-jsx@4.0.1` (via `@eyeseetea/d2-ui-components`) resolves `loader-utils` to `1.2.3` without the entry.
- **Fixes:** GHSA-76p3-8jx3-jpfq (critical, `< 1.4.1`), GHSA-3rfm-jhwj-7488 and GHSA-hhq3-ff78-jv3g (high, `< 1.4.2`).
- **Drop when:** no consumer requests `loader-utils < 1.4.2` (`yarn why loader-utils -R`).

#### `node-fetch: ^2.6.7`

- **Why:** without the entry `node-fetch@1.7.3` enters the tree (from `isomorphic-fetch@2.2.1`) next to `2.7.0`. With it, everything resolves to `2.7.0`, including `cross-fetch@4.1.0`, which declares `^2.7.0`.
- **Fixes:** GHSA-r683-j2x4-v87g (high): secure headers forwarded across a cross-host redirect, `< 2.6.7`.
- **Note:** a floor. An exact `2.6.7` held `cross-fetch@4.1.0` below its own `^2.7.0` range.
- **Drop when:** nothing in the tree requests `node-fetch@1`.

#### `linkify-it: ^5.0.2`

- **Why:** `react-linkify@1.0.0-alpha` (via `@eyeseetea/d2-ui-components`) requests `linkify-it@^2.0.3`. Without the entry the tree holds `2.2.0`, inside the advisory ranges. This is a major-version jump over the declared range; `require("linkify-it")` loads `5.0.2` and `new LinkifyIt().test("http://a.com")` returns `true`.
- **Fixes:** GHSA-v245-v573-v5vm and GHSA-22p9-wv53-3rq4 (high, ReDoS/quadratic scan, `<= 5.0.1`).
- **Drop when:** `react-linkify` (or `d2-ui-components`) stops depending on `linkify-it@2`. Root cause is internal to the EyeSeeTea libraries; a ticket for the exact pins is suggested.

#### `i18next-conv/node-gettext: ^3.0.1`

- **Why:** `i18next-conv` requests `node-gettext@2.1.0`. Scoped to that parent so nothing else is affected.
- **Fixes:** GHSA-g974-hxvm-x689 (high, `<= 3.0.0`).
- **Verified by running the consumer:** `yarn extract-pot`, `yarn update-po` and `yarn localize` all complete.
- **Drop when:** `i18next-conv` requests `node-gettext >= 3.0.1`. Copied from `dhis2-app-skeleton`.

### Build tooling

#### `vite: ^7.3.7`

- **Why:** this is a **compatibility ceiling, not a security pin.** `vitest@4.1.12` requests its own `vite` (8.x); without the entry the tree holds `7.3.7` and `8.3.5`. The entry keeps one line, the one `@vitejs/plugin-react` and `vite-plugin-singlefile` are built against.
- **Fixes:** nothing directly; the version itself was chosen in the vite upgrade (`7.3.7`).
- **Drop when:** the project moves to Vite 8 (and the plugins support it), or `vitest` supports 7.

---

## Resolutions that change nothing today

Measured by removing each entry alone: the installed versions do not change, because the declared range already resolves to a patched release. They were kept in this change as floors; **they can be dropped** unless a reviewer prefers the guard.

| Entry | Without it | Advisory floor |
|---|---|---|
| `handlebars: ^4.7.10` | stays `4.7.10` | GHSA-8r5x-fm3f-whwj, GHSA-p8wg-vrv2-v86f (critical), GHSA-xw65-4hp5-5hc7: `<= 4.7.9` |
| `minimatch: ^3.1.4` | stays `3.1.5` | GHSA-23c5-xmqv-rm74 (high): `< 3.1.4` |
| `brace-expansion: ^1.1.21` | stays `1.1.21` | several highs, last fixed in `1.1.21` |

## Older entries not backed by a finding

No advisory in the GitHub database covers the version that comes back without these entries (checked 2026-11-02). They are historical Snyk-era pins, not needed by the audit today. **Candidates to drop** (verify with `yarn install` and the test/build suite):

| Entry | Without it | Note |
|---|---|---|
| `@babel/traverse: ^7.23.2` | `7.29.10` | range, harmless |
| `@babel/runtime: 7.29.7` / `@babel/runtime-corejs3: 7.29.7` | `7.29.10` | exact pins hold the tree below the latest |
| `uglify-js: 3.14.3` | `3.19.3` | consumer is `handlebars` (via `@dhis2/d2-i18n-generate`) |
| `glob-parent: 5.1.2` | `3.1.0`, `5.1.2`, `6.0.2` | GHSA-ww39-953v-wcq6 covers `>= 4.0.0, < 5.1.2`; neither `3.1.0` nor `6.0.2` is in range |
| `minimist: 1.2.6` | `1.2.8` | no advisory on either |

---

## Accepted findings (not fixed)

### `xlsx@0.18.5`: two high advisories

- **Findings:** GHSA-4r6h-8v6p-xvw6 (prototype pollution, `< 0.19.3`) and GHSA-5pgg-2g8v-p4x9 (ReDoS, `< 0.20.2`).
- **Why accepted:** `0.18.5` is the latest release on npm (`dist-tags.latest`, last modified 2026-07-17); SheetJS publishes fixed releases only from its own site, not to npm, so no patched version is reachable from the registry. A scoped resolution cannot help either.
- **Exposure:** it is a `devDependency` used only by the three CLI scripts `build-tub-ou-toggle`, `build-tub-ou-toggle-hide` and `build-tub-ou-toggle-disable` (added in `0adee34`), which read an Excel rules file supplied by the person running them. It is not part of the data-entry form bundle nor of the configurator. Risk is low.
- **Revisit when:** SheetJS publishes a patched build to npm, or the scripts are replaced by another reader (`@e965/xlsx@0.20.3` is a published fork that lies outside both ranges but is not an official release). The same decision was taken in `EyeSeeTea/d2-tools#109`.

### `joi@17.13.8`: one high advisory, fix not yet installable

- **Finding:** GHSA-4528-x5fx-h6hg (quadratic-time `string().email({ multiple: true })`), published 2026-10-30. Via `wait-on@6.0.0`, a dev-time helper.
- **Why accepted today:** the fix `17.13.9` was published on 2026-10-28 and is younger than the 7-day `npmMinimalAgeGate`; `yarn up -R joi` keeps `17.13.8`.
- **Action:** after 2026-11-04 run `yarn up -R joi` and re-audit. No resolution is needed, since `wait-on` requests `joi@^17.4.0`.

### `braces@3.0.3`: withdrawn advisory still reported by Dependency-Track

- **Finding:** GHSA-vfj7-8cjw-p6xm (stack exhaustion on deeply nested patterns, `<= 3.0.3`, no patched version). GitHub marks it **withdrawn**, so `yarn npm audit` does not report it, but Dependency-Track still does, and the CI gate follows Dependency-Track.
- **Why accepted:** nothing to upgrade to. `3.0.3` is the latest `3.x` and the advisory has no fix.
- **Revisit when:** Dependency-Track drops the withdrawn advisory.

### CodeQL `js/redos` in `src/utils/codec.ts:79`

- Two high alerts first seen on 2025-01-06, so older than this change. It is a regular expression in the project's own code, not a dependency, and is out of scope for this remediation.

### Remaining moderate and low findings

29 moderate and 3 low entries in `yarn npm audit -R` on 2026-11-02, none critical (Dependency-Track reports 8 medium and 2 low on the same commit; the two tools count differently). They sit in development tooling (ESLint, Vite/Vitest toolchain, `wait-on`, etc.) and were not addressed in this change. Re-run the audit for the current list.

## Re-check list

- `follow-redirects` was re-resolved to `1.16.2` on 2026-11-02 (GHSA-mrwp-f3q8-3g9p, `>= 1.16.0, <= 1.16.1`, published 2026-10-30): no entry, `axios@1.20.0` requests `^1.16.0`.
- Pins that would disappear with a newer `@eyeseetea/d2-api` (installed `1.16.0`): `axios`, `lodash`, `qs`. Newer releases may drop the exact pins; check before the next dependency bump.
