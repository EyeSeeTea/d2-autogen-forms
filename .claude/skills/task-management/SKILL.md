---
name: task-management
description: >
    Project management skill for creating and managing tasks in the issue tracker
    from OpenSpec artifacts. Use whenever creating tasks, updating status, planning
    sprints, or coordinating work between development agents. Trigger on any
    mention of tickets, tasks, sprint planning, or project tracking.
---

# Issue Tracker Task Management

This project uses **GitHub Issues** for task tracking.

-   Repository: https://github.com/EyeSeeTea/d2-autogen-forms
-   Use `gh` CLI for creating and managing issues

## Creating Tasks from OpenSpec

When given an OpenSpec change proposal:

1. Read `openspec/changes/<change-name>/tasks.md` for the task breakdown
2. Read `openspec/changes/<change-name>/design.md` for technical context
3. For each task, create a GitHub Issue with:
    - **Title**: `[ROLE] Task description`
    - **Body**: Include acceptance criteria from the spec
    - **Labels**: Role tag (`fe`, `be`, `gd`), feature name, priority
    - **Assignee**: Map to the appropriate agent role
    - **Milestone**: Sprint or release milestone if applicable

### Creating Issues via CLI

```bash
# Simple issue
gh issue create --title "[FE] Implement form grid view" --body "..." --label "fe,feature-name"

# With assignee and milestone
gh issue create --title "[BE] Add DataStore repository" --body "..." --label "be,feature-name" --assignee "@me" --milestone "v1.5"

# List issues for a feature
gh issue list --label "feature-name"

# Update issue status
gh issue close <number>
gh issue reopen <number>
```

## Role-to-Assignee Mapping

| Role Tag | Agent              | Task Type                                                   |
| -------- | ------------------ | ----------------------------------------------------------- |
| [FE]     | frontend-developer | UI components, React views, form rendering                  |
| [BE]     | backend-developer  | Domain entities, use cases, DHIS2 integrations, CLI scripts |
| [GD]     | graphical-designer | Visual design, wireframes, mockups                          |
| [CR]     | code-reviewer      | PR review, code quality audit                               |

Note: No database role — all persistence is through the DHIS2 API.

## Task Dependencies

Create tasks in dependency order:

1. Domain entities/interfaces -> Repository implementations -> compositionRoot.ts wiring -> Use cases
2. UX wireframes -> GD mockups -> FE implementation
3. Both tracks can run in parallel

## Task Structure Strategy

Choose the structure based on feature complexity:

**Simple features** (roughly 5 or fewer tasks):

-   Create ONE parent issue named: `[Feature name] - Brief description`
-   Create subtasks as a checklist in the parent issue body
-   Or create linked child issues referencing the parent

**Complex features** (more than 5 tasks, or multiple parallel tracks):

-   Create multiple standalone issues
-   Every issue title MUST include the feature name as a prefix so they can be filtered together
-   Format: `[Feature name] [ROLE] Task description`
-   Use a shared GitHub label for the feature to group them

When in doubt, prefer the simple approach (parent + checklist).

## Status Flow

`open` -> `in progress` (assign yourself) -> `closed` (via PR merge or `gh issue close`)
