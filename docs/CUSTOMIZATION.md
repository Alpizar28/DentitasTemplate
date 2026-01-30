# Customization Guide

## Where to write code?

| Goal | Directory |
| :--- | :--- |
| **Add Business Logic** | `src/modules/custom/policies/` |
| **Integrate Service** | `src/modules/custom/adapters/` |
| **Add API Endpoint** | `src/api/routes/` |
| **Style UI** | `src/ui-client/theme/` |
| **Create Page** | `src/ui-client/pages/` |

## How to add a Custom Policy

1.  **Create the Policy Class**
    Create `src/modules/custom/policies/vip-booking.policy.ts` implementing `IPolicy`.

    ```typescript
    export class VipBookingPolicy implements IPolicy {
        id = 'VipBookingPolicy';
        order = 100;
        // implementation...
    }
    ```

2.  **Register the Policy**
    Extend the registry in `src/modules/custom/policy.extension.ts` (if available) or via the main configuration injection point.

3.  **Configure It**
    Add parameters to `seeds/base-config.json`:
    ```json
    "policies": {
        "VipBookingPolicy": { "vipList": ["user_1"] }
    }
    ```

## How to Customize UI

1.  **Theming**
    Edit `src/ui-client/theme/tokens.ts` to change colors, fonts, and spacing.

2.  **Slots Grid**
    Use `<TimeSlotGrid />` from `ui-core` but wrap it with your own container in `src/ui-verticals/dentist/SlotPicker.tsx`.

## ⛔ What NOT to touch

*   `src/modules/booking/**`: This is the engine.
*   `supabase/migrations/20260130...`: Core schema.
*   `PolicyEngine` logic: Do not change how rules are weighed.
