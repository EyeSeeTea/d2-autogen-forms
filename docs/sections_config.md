# Sections Config

## toggleMultiple

`toggleMultiple` lets a section's visibility (and optionally its disabled state) depend on multiple conditions. It lives under:

```json
{
    "dataSets": {
        "<DATA_SET_CODE>": {
            "sections": {
                "<SECTION_CODE>": {
                    "toggleMultiple": { ... }
                }
            }
        }
    }
}
```

### Shape

```json
{
    "toggleMultiple": {
        "logicalOperator": "AND",
        "conditions": [
            {
                "type": "dataElement",
                "dataElement": "DE_CODE",
                "condition": "true",
                "disabled": false
            },
            {
                "type": "orgUnit",
                "orgUnits": ["OU_A", "OU_B"],
                "condition": "hide",
                "dataElements": ["DE_1", "DE_2"],
                "disabled": true
            }
        ]
    }
}
```

### Fields

- `logicalOperator`: `"AND"` or `"OR"`. It combines all evaluated conditions.
- `conditions`: list of condition objects.
  - `type`: `"dataElement"` or `"orgUnit"`. If omitted, it defaults to `"dataElement"`.
  - `condition`:
    - For `dataElement`: same comparison syntax as data element rules (e.g. `"true"`, `"approved"`, `"> 10"`).
    - For `orgUnit`: `"show"` or `"hide"`.
  - `dataElement` (dataElement type): data element code to evaluate.
  - `orgUnits` (orgUnit type): org unit codes to compare against the current org unit.
  - `dataElements` (orgUnit type, optional): limit per-data-element disabling to a subset of section data elements. If omitted, all section data elements are targeted.
  - `disabled` (optional): if any condition sets this to `true`, and the overall toggle evaluates to `false`, the section remains visible but disabled instead of being hidden.

### Evaluation

- All conditions are expanded into internal toggle entries.
  - `dataElement` conditions become one entry.
  - `orgUnit` conditions create an entry for each targeted data element (all section data elements or those in `dataElements`).
- The section is visible when the combined condition result is `true`.
- If the combined result is `false`:
  - If any condition has `disabled: true`, the section stays visible but is disabled.
  - Otherwise, the section is hidden.
- For `orgUnit` conditions with `disabled: true`, the targeted data elements are disabled for org units where the condition would hide the section:
  - `condition: "hide"` disables when the org unit is in `orgUnits`.
  - `condition: "show"` disables when the org unit is not in `orgUnits`.

Missing data element codes are ignored with a console warning.

### Examples

Show a section when any condition matches:

```json
{
    "toggleMultiple": {
        "logicalOperator": "OR",
        "conditions": [
            { "type": "orgUnit", "orgUnits": ["USA", "CAN"], "condition": "show" },
            { "type": "dataElement", "dataElement": "DE_APPROVED", "condition": "true" }
        ]
    }
}
```

Disable (instead of hide) for some org units and only specific data elements:

```json
{
    "toggleMultiple": {
        "logicalOperator": "OR",
        "conditions": [
            {
                "type": "orgUnit",
                "orgUnits": ["ASM", "AND"],
                "condition": "hide",
                "disabled": true
            },
            {
                "type": "orgUnit",
                "orgUnits": ["AUT", "BEL"],
                "condition": "hide",
                "dataElements": ["DE_A", "DE_B"],
                "disabled": true
            }
        ]
    }
}
```
