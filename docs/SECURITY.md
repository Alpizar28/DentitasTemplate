# Security Hardening

## Row Level Security (RLS)

BellBooking relies heavily on Supabase RLS.
*   **Bookings**: Users can only see their own bookings. Admins see all.
*   **Availability**: Public read access to `bookings` (filtered fields) or specific views.
*   **Config**: `app_config` is READ-ONLY for the service role (backend). It should NOT be exposed to `anon` client directly.

## Environment Variables

| Variable | Description | exposure |
| :--- | :--- | :--- |
| `SUPABASE_URL` | API Endpoint | Public |
| `SUPABASE_ANON_KEY` | Public Client Key | Public |
| `SUPABASE_SERVICE_ROLE` | Admin Access | **PRIVATE (Server Only)** |
| `BOOKING_EMERGENCY_*` | Operational Flags | **PRIVATE (Server Only)** |

## Data Validation

*   **Inputs**: All API inputs are validated with Zod schemas.
*   **Logic**: `PolicyEngine` validates business rules closer to the core.
*   **Database**: Postgres `EXCLUDE` constraints prevent double-booking at the physical level.

## Audit Logging

Sensitive actions are logged to the `audit_logs` table.
*   Policy Denials
*   Cancellations
*   Overrides
