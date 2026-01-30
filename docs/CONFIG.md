# Configuration Guide

BellBooking uses a hierarchical configuration system designed to be safe, dynamic, and version-controlled.

## The Source of Truth: `seeds/base-config.json`

This file contains the baseline configuration for your project. It should be committed to Git.

```json
{
  "version": "1.0.0",
  "business": {
    "timezone": "UTC",
    "currency": "USD"
  },
  "featureFlags": {
    "booking.policies.lead_time.enabled": true
  },
  "policies": {
    "LeadTimePolicy": { "minMinutes": 60 }
  }
}
```

## How to Change Configuration

### 1. Permanent Change (Codebase)
1.  Edit `seeds/base-config.json`.
2.  Run `npm run seed:config`.
3.  Restart the application.

### 2. Runtime Override (Admin/DB)
You can directly edit the `app_config` table in Supabase to change behavior without a deploy.
*   **Table**: `app_config`
*   **Column**: `config_json`
*   **Condition**: `is_active = true` AND `environment = 'production'` (or current env)

### 3. Emergency Flags (Env Vars)
For critical ops, you can override flags via environment variables (Server-side only).
*   `BOOKING_EMERGENCY_DISABLE_ALL_POLICIES=true`

## Parameters Index

| Policy | Parameter | Description |
| :--- | :--- | :--- |
| `LeadTimePolicy` | `minMinutes` | Minimum time before booking start. |
| `MaxAdvanceBookingPolicy` | `maxMinutes` | Maximum time into the future. |

## Feature Flags

Flags control the **activation** of logic, not parameters.
*   Prefix: `booking.policies.*`
*   Default: Most policies are `enabled: true` by default in M2.
