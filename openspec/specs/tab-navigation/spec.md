## ADDED Requirements

### Requirement: Navigation bar visibility controlled by DataStore config
The system SHALL display a tab navigation bar at the bottom of the tabbed form content only when the dataset's DataStore config includes `showNavigation: true`. When `showNavigation` is absent or set to any value other than `true`, the navigation bar SHALL NOT be rendered.

#### Scenario: showNavigation is true
- **WHEN** a dataset config has `"showNavigation": true` and the form has tabbed sections
- **THEN** a navigation bar is rendered below the active tab content

#### Scenario: showNavigation is absent
- **WHEN** a dataset config does not include the `showNavigation` field
- **THEN** no navigation bar is rendered

#### Scenario: showNavigation is false
- **WHEN** a dataset config has `"showNavigation": false`
- **THEN** no navigation bar is rendered

#### Scenario: No tabbed sections
- **WHEN** a dataset config has `"showNavigation": true` but the form has no tabbed sections
- **THEN** no navigation bar is rendered

### Requirement: Navigation bar layout
The navigation bar SHALL display three elements in a single row: a Previous button aligned to the left, a position indicator centered, and a Next button aligned to the right.

#### Scenario: Standard layout
- **WHEN** the navigation bar is visible and the user is on tab 3 of 7
- **THEN** the bar displays `[Previous] 3/7 [Next]` with Previous on the left, "3/7" centered, and Next on the right

### Requirement: Previous button behavior
The Previous button SHALL navigate to the previous visible tab when clicked. It SHALL be disabled when the user is on the first visible tab.

#### Scenario: Navigate to previous tab
- **WHEN** the user is on tab 3 and clicks Previous
- **THEN** the active tab changes to tab 2

#### Scenario: Previous disabled on first tab
- **WHEN** the user is on the first visible tab
- **THEN** the Previous button is disabled and not clickable

### Requirement: Next button behavior
The Next button SHALL navigate to the next visible tab when clicked. It SHALL be disabled when the user is on the last visible tab.

#### Scenario: Navigate to next tab
- **WHEN** the user is on tab 3 of 7 and clicks Next
- **THEN** the active tab changes to tab 4

#### Scenario: Next disabled on last tab
- **WHEN** the user is on the last visible tab
- **THEN** the Next button is disabled and not clickable

### Requirement: Position indicator reflects only visible tabs
The position indicator (X/Y) SHALL count only tabs that are currently visible (not hidden by visibility rules). Hidden tabs SHALL be excluded from both the current position (X) and the total count (Y).

#### Scenario: All tabs visible
- **WHEN** there are 5 primary tabs, all visible, and the user is on tab 3
- **THEN** the indicator shows "3/5"

#### Scenario: Some tabs hidden by rules
- **WHEN** there are 5 primary tabs but tabs 2 and 4 are hidden by visibility rules, and the user is on the originally-third tab
- **THEN** the indicator shows "2/3" (only visible tabs 1, 3, 5 are counted)

#### Scenario: Tab becomes hidden while on it
- **WHEN** the active tab becomes hidden due to a visibility rule change
- **THEN** the navigation switches to the nearest visible tab and updates the indicator

### Requirement: Navigation excludes the Others tab
The "Others" tab (untabbed sections) SHALL NOT be included in the navigation sequence. The Previous/Next buttons SHALL only cycle through primary tabbed sections.

#### Scenario: Others tab present
- **WHEN** the form has 3 primary tabs and an "Others" tab, and the user is on tab 3
- **THEN** the Next button is disabled (tab 3 is the last navigable tab) and the indicator shows "3/3"
