# BellBooking Template 📅

> **Professional Booking System Core for Next.js + Supabase**

Este repositorio es una **plantilla de arquitectura empresarial** ("Template") diseñada para acelerar el desarrollo de sistemas de reservas y citas de alta complejidad (Citas médicas, coworking, alquileres, etc.).

No es solo un "boilerplate" de UI; incluye un núcleo de reservas robusto (DDD + Hexagonal) pre-construido.

---

## 🚀 Módulos Incluidos

El sistema se divide en módulos arquitectónicos robustos:

*   **Módulo 1: Booking Core (Transactional)** 🛡️
    *   Gestión de estados (Held, Confirmed, Cancelled).
    *   Concurrencia pesimista (Row Locking & Exclusion Constraints).
    *   Arquitectura Hexagonal pura.
    *   [Ver Diseño (Core)](src/modules/booking/CORE_CONTRACT.md)

*   **Módulo 2: Availability Engine (Smart)** 🧠
    *   Cálculo determinístico de slots.
    *   Timezone-aware (Soporte multi-zona).
    *   Config-driven (Shifts, Breaks, Exceptions dinámicos).
    *   [Ver Diseño (Availability)](src/modules/booking/M2_AVAILABILITY_DESIGN.md)

*   **Módulo 3: Configuration System** ⚙️
    *   Sistema de configuración por capas (File -> DB -> Env).
    *   Feature Flags nativos.
    *   Seed script idempotente.
    *   [Ver Diseño (Config)](src/modules/booking/M3_CONFIG_DESIGN.md)

---

## 🛠️ Tecnologías

*   **Frontend:** Next.js 16 (App Router), Tailwind CSS v4, React 19.
*   **Backend:** Server Actions (Next.js), Supabase (PostgreSQL + Auth).
*   **Testing:** Vitest (Integration & Unit).
*   **Utils:** date-fns, zod (validation).

---

## 🏁 Quick Start (Para nuevos proyectos)

### 1. Requisitos
*   Node.js 18+
*   Docker (para Supabase Local) o Proyecto Supabase Cloud.

### 2. Instalación
```bash
# Instalar dependencias
npm install
```

### 3. Configuración de Entorno
Copia el ejemplo y configura tus credenciales de Supabase:
```bash
cp .env.example .env.development
# Editar .env.development con:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=... (Para seeds/admin tasks)
```

### 4. Base de Datos & Seeds
Aplica las migraciones y carga la configuración inicial:
```bash
# Aplicar esquema DB
npm run db:push

# Sembrar configuración (Shifts, Policies)
npm run seed:config:dev
```

### 5. Iniciar Desarrollo
```bash
npm run dev
```
Visita `http://localhost:3000/playground/availability` para probar el motor.

---

## 🧪 Testing

Este template viene con una suite de tests de integración para garantizar que el núcleo no se rompa al extenderlo.

```bash
# Correr todos los tests
npm run test:watch
```
