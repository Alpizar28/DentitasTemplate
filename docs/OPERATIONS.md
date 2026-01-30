# Operations Manual

## Bootstrapping a New Environment

1.  **Database Sync**: Run `npx supabase db push`.
2.  **Configuration Seed**: Run `npm run seed:config`.

## Routine Tasks

### Reloading Configuration
If you changed `app_config` in the database, the service needs to reload.
*   **Current Method**: Restart the application container/node process.
*   **Future**: Call `POST /api/admin/config/reload` (if enabled security protected).

### Cleaning Up Stale Holds
The system relies on "Lazy Expiration" at the DB level (trigger) or application level.
*   Ensure `pg_cron` is active if using DB maintenance.

## Troubleshooting

### "Policy Denied" Errors
Check `audit_logs` table.
*   `reason_code`: Why was it denied?
*   `details`: What parameters failed? (e.g., `actualLeadMinutes: 45` vs `min: 60`).

### "Config Validation Failed"
The application refuses to start.
1.  Check `seeds/base-config.json` syntax.
2.  Check `app_config` in DB for corrupt JSON.
3.  Check logs for specific Zod path error.
