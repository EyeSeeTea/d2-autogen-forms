# DataElement Rules

Data elements can have conditional visibility and enabled/disabled states based on the values of other data elements. Rules are configured in the data store under `dataElements.[CODE].rules`.

## Rule Types

-   **`visible`**: Controls whether a data element is shown or hidden in the form
-   **`disabled`**: Controls whether a data element is read-only (disabled) or editable
-   **`enabled`**: Controls whether a data element is editable (enabled) - opposite of `disabled` with inverted logic

## Single Condition Rules

The simplest rule format applies rules from a control element to target elements:

```json
{
    "dataElements": {
        "CONTROL_ELEMENT": {
            "rules": {
                "visible": {
                    "dataElements": ["TARGET_ELEMENT_1", "TARGET_ELEMENT_2"],
                    "condition": "true"
                }
            }
        }
    }
}
```

This makes `TARGET_ELEMENT_1` and `TARGET_ELEMENT_2` visible only when `CONTROL_ELEMENT` has the value `"true"`.

**Note**: The element you configure (the key) is the **control element** whose value is checked. The elements in the `dataElements` array are the **target elements** that get affected by the rule.

## Multiple Condition Rules

For more complex scenarios, you can use multiple conditions with OR logic (if ANY condition matches, the rule applies):

```json
{
    "dataElements": {
        "STATUS_ELEMENT": {
            "rules": {
                "disabled": {
                    "type": "option",
                    "conditions": [
                        { "dataElements": ["TARGET_ELEMENT_1", "TARGET_ELEMENT_2"], "condition": "approved" },
                        { "dataElements": ["TARGET_ELEMENT_1"], "condition": "locked" }
                    ]
                }
            }
        }
    }
}
```

This disables `TARGET_ELEMENT_1` when `STATUS_ELEMENT` is either `"approved"` OR `"locked"`, and disables `TARGET_ELEMENT_2` when `STATUS_ELEMENT` is `"approved"`.

## Condition Formats

Conditions can be simple equality checks or numeric comparisons:

-   **Equality**: `"condition": "value"` - Matches exact string value
-   **Boolean values**: `"condition": "true"` or `"condition": "false"`
-   **Numeric comparisons**:
    -   `"condition": "> 10"` - Greater than
    -   `"condition": "< 5"` - Less than
    -   `"condition": ">= 100"` - Greater than or equal to
    -   `"condition": "<= 50"` - Less than or equal to
    -   `"condition": "== 0"` - Equal to
    -   `"condition": "!= 0"` - Not equal to

## Multiple Target Data Elements

You can apply rules to multiple target elements at once:

```json
{
    "dataElements": {
        "CONTROL_ELEMENT": {
            "rules": {
                "visible": {
                    "dataElements": ["TARGET_A", "TARGET_B", "TARGET_C"],
                    "condition": "true"
                }
            }
        }
    }
}
```

This makes all three target elements (TARGET_A, TARGET_B, and TARGET_C) visible when `CONTROL_ELEMENT` is `"true"`.

## The `enabled` Rule (Positive Logic)

**Use Case**: Instead of listing all cases when an element should be disabled, you specify when it should be enabled.

**Example - Before (using `disabled` with multiple conditions)**:

```json
{
    "dataElements": {
        "BOOLEAN_DE": {
            "rules": {
                "disabled": {
                    "type": "option",
                    "conditions": [
                        { "dataElements": ["TARGET_ELEMENT"], "condition": "false" },
                        { "dataElements": ["TARGET_ELEMENT"], "condition": "undefined" }
                    ]
                }
            }
        }
    }
}
```

**Example - After (using `enabled`)**:

```json
{
    "dataElements": {
        "BOOLEAN_DE": {
            "rules": {
                "enabled": {
                    "dataElements": ["TARGET_ELEMENT"],
                    "condition": "true"
                }
            }
        }
    }
}
```

**How it works**:

-   **`enabled` rules**: Element is editable if ANY rule matches. If no rules match, the element is **disabled**.
-   **Priority**: `disabled` rules take precedence over `enabled` rules
-   **Default behavior**: If neither `enabled` nor `disabled` rules exist, the element is enabled by default

**Rule Precedence**:

1.  If ANY `disabled` rule matches → Element is **disabled** (highest priority)
2.  Else, if ANY `enabled` rule matches → Element is **enabled**
3.  Else, if `enabled` rules exist but none match → Element is **disabled**
4.  Else (no `enabled` or `disabled` rules) → Element is **enabled** (default)
