# Estructura del Repositorio y Convenciones - Módulo 1 (Core)

> [!NOTE]
> Este documento define la arquitectura de carpetas para implementar el Core Domain bajo DDD + Hexagonal, asegurando aislamiento total de UI y Frameworks externos.

## 1. Propuesta de Estructura de Directorios

Implementaremos el patrón **Modular Monolith** dentro de `src/modules`. El Módulo 1 vivirá en `src/modules/booking`.

```text
src/
├── shared/                     # Kernel compartido (Tipos base, Result pattern)
│   ├── domain/                 # Value Objects genéricos (UUID, Email)
│   └── infrastructure/         # Drivers genéricos (Supabase Client Wrapper)
│
└── modules/
    └── booking/                # MÓDULO 1: CORE DOMAIN
        ├── domain/             # 🟢 CAPA DOMINO (Pura, Sin dependencias)
        │   ├── entities/       # Booking, Resource (Aggregate Roots)
        │   ├── value-objects/  # TimeRange, BookingId, Actor
        │   ├── ports/          # Interfaces (IBookingRepository, IAvailabilityService)
        │   ├── events/         # Domain Events (BookingConfirmed, HoldExpired)
        │   └── errors/         # Errores de dominio (OverlapError, RuleViolationError)
        │
        ├── application/        # 🟡 CAPA APLICACIÓN (Casos de Uso)
        │   ├── use-cases/      # CreateBookingUseCase, FindAvailabilityUseCase
        │   └── dtos/           # Input/Output DTOs (CreateBookingCommand)
        │
        └── infrastructure/     # 🔴 CAPA INFRAESTRUCTURA (Implementación)
            ├── repositories/   # SupabaseBookingRepository (Implementa Port)
            ├── mappers/        # Convierte DB Row -> Domain Entity
            └── triggers/       # SQL definitions (para referencia/deploy)
```

## 2. Convenciones de Naming y Código

### Archivos y Directorios
*   **Directorios:** `kebab-case` (ej. `value-objects`, `use-cases`).
*   **Archivos:** `kebab-case.ts` (ej. `booking.entity.ts`, `create-booking.use-case.ts`).
*   **Tests:** `[nombre].spec.ts` junto al archivo que testea (colocation).

### Clases e Interfaces
*   **Entities:** `PascalCase` (ej. `Booking`, `Resource`).
*   **Interfaces (Ports):** Prefijo `I` (ej. `IBookingRepository`).
*   **Use Cases:** Verbo + Sustantivo + UseCase (ej. `CreateBookingUseCase`).
*   **Implementaciones:** Nombre + Tech (ej. `SupabaseBookingRepository`).

### Manejo de Errores (Domain Errors)
*   Nunca lanzar `Exceptions` genéricas.
*   Retornar `Result<T, E>` (Railway/Functional Error Handling) O usar clases de error tipadas:
    *   `DomainError` (Base)
    *   `Booking overlap detected` -> `OverlapError`
    *   `Resource not found` -> `ResourceNotFoundError`

## 3. Responsabilidades por Capa (Strict Boundaries)

### 🟢 Domain (`src/modules/booking/domain`)
*   **PROHIBIDO:** Importar `supabase-js`, `react`, `next`, `axios`.
*   **PERMITIDO:** Tipos primitivos, lógica de negocio pura (validar rangos, transiciones de estado).
*   **Propósito:** Definir QUÉ es el negocio.

### 🟡 Application (`src/modules/booking/application`)
*   **PROHIBIDO:** Consultas SQL directas, HTTP calls de bajo nivel.
*   **PERMITIDO:** Orquestar repositorios, llamar al dominio, usar Value Objects.
*   **Propósito:** Definir QUÉ PUEDE HACER el usuario (Casos de Uso).

### 🔴 Infrastructure (`src/modules/booking/infrastructure`)
*   **PROHIBIDO:** Lógica de negocio core (no calcular precios aquí).
*   **PERMITIDO:** SQL, API Calls, Cron configs, Serialización.
*   **Propósito:** CÓMO se guardan y comunican los datos.

## 4. Archivos a Crear (Scaffolding Plan)

### Skeleton Básico
1.  `src/modules/booking/README.md` (Documentación del módulo).
2.  `src/shared/domain/result.ts` (Utilidad para Result Pattern).

### Domain Layer
3.  `src/modules/booking/domain/entities/booking.entity.ts`
4.  `src/modules/booking/domain/entities/resource.entity.ts`
5.  `src/modules/booking/domain/value-objects/time-range.vo.ts`
6.  `src/modules/booking/domain/value-objects/booking-status.vo.ts`
7.  `src/modules/booking/domain/ports/booking-repository.port.ts`
8.  `src/modules/booking/domain/errors/booking.errors.ts`

### Infrastructure Layer (Initial)
9.  `src/modules/booking/infrastructure/booking.sql` (DDL de tablas).

*(Application Layer se crea luego de tener el Dominio definido)*.
