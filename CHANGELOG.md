# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-29

### Added
- **Module 1 (Core)**: Booking entity, TimeRange VO, FSM, and Supabase Exclusion Constraints.
- **Module 2 (Policies)**: PolicyEngine, Rule Registry, Feature Flags, and basic policies (LeadTime, MaxAdvance).
- **Module 3 (Config)**: ConfigService with merge strategy (Env > DB > File > Defaults) and idempotent seeding.
- **Module 4 (Scaffolding)**: Template structure definition and strict core/custom boundaries.
- **Module 5 (Ops)**: Audit logging design, performance guidelines, and security hardening checklist.
- **Module 6 (UI Core)**: Headless UI component definitions and UX contracts for policy handling.

### Security
- Implemented RLS (Row Level Security) foundation.
- Configurable "Emergency Flags" via environment variables.

### Infrastructure
- Supabase migrations for `bookings`, `resources`, `app_config`, and `audit_logs`.
