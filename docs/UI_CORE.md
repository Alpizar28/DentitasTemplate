# UI Core System

**UI Core** is a "headless" component library designed for booking flows. It provides the logical components without enforcing a specific visual style or industry vertical.

## Philosophies

1.  **Dumb Components**: Components do not calculate availability. They display what the API returns.
2.  **Policy Driven**: If the API returns `DENY`, the UI renders a `<PolicyFeedbackBanner />`.
3.  **State Machine**: The booking flow is a wizard `Selection -> Hold -> Confirmation -> Success`.

## Key Components

| Component | Purpose |
| :--- | :--- |
| `BookingFlowShell` | Manages the wizard step state. |
| `TimeSlotGrid` | Renders slots. Handles selection state. |
| `DatePickerCore` | Selecting dates within allowed ranges. |
| `PolicyFeedbackBanner` | Standardized error/warning display. |

## How to Consume

Import components into your vertical's pages:

```tsx
import { BookingFlowShell, TimeSlotGrid } from 'src/ui-core';

export default function DentistBookingPage() {
  return (
    <BookingFlowShell>
       <TimeSlotGrid slots={...} />
    </BookingFlowShell>
  );
}
```

## Styling

UI Core components accept `className` or style objects, but rely on `src/ui-client/theme` for tokens.
