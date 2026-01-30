# System Architecture

## Overview

BellBooking implementation follows **Hexagonal Architecture (Ports & Adapters)** and **Domain-Driven Design (DDD)**. The goal is to isolate the business logic (Domain) from external dependencies (Infrastructure) and provide a strict boundary for customization.

## Module Structure

| Module | Responsibility | Key Components | Status |
| :--- | :--- | :--- | :--- |
| **M1: Core Domain** | Scheduling logic, FSM, Constraints. | `Booking`, `TimeRange`, `Supabase EXCLUDE` | 🔒 Locked |
| **M2: Extensibility** | Business rules engine. | `PolicyEngine`, `PolicyRegistry`, `FeatureFlagProvider` | 🔒 Locked |
| **M3: Configuration** | Dynamic rules & seeding. | `ConfigService`, `IConfigRepository` | 🔒 Locked |
| **M4: Template** | Scaffolding & Boundaries. | Folder Structure, Scripts | 🔒 Locked |
| **M5: Operations** | Audit, Security, Performance. | `AuditLogger`, `PerformanceGuard` | 🔒 Locked |
| **M6: UI Core** | Headless frontend modules. | `BookingWizard`, `TimeGrid` | 🔒 Locked |

## Core vs. Custom Boundary

### 🔒 THE CORE (`src/modules/booking`, `src/ui-core`)
**Do not modify this code.** Updates to the core are distributed via template synchronization. Modifying core files will create conflicts and break upgrade paths.

### ✅ THE CUSTOM LAYER (`src/modules/custom`, `src/ui-verticals`)
This is your playground.
*   **Policies**: Add new business rules (e.g., `VIPBookingPolicy`).
*   **Adapters**: Connect to 3rd party services (e.g., `StripeAdapter`).
*   **UI**: Compose screens using UI Core components and apply your branding.

## Key Patterns

### Policy Engine
Instead of spaghetti `if` statements, business rules are encapsulated in **Policies**.
*   **ALLOW**: The booking proceeds.
*   **DENY**: The booking stops (e.g., "Too soon").
*   **REQUIRE_ACTION**: User must do something (e.g., "Pay deposit").

### Configuration Cascade
Configuration is resolved in this order (Highest wins):
1.  **Env Vars** (Emergency overrides)
2.  **Database** (`app_config` table)
3.  **File** (`seeds/base-config.json`)
4.  **Code Defaults**

## Data Flow
`UI` -> `API` -> `PolicyEngine` -> `Domain` -> `Repository` -> `DB`
