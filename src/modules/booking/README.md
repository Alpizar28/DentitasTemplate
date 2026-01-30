# Booking Module (Core)

> **Módulo 1:** Core Domain & Booking Engine
> **Estado:** Implementación
> **Diseño:** [Final Design Decisions](../../../docs/module_1_core_domain/final_design_decisions.md)

Este módulo contiene la lógica pura de negocio para el sistema de reservas.
Sigue arquitectura **DDD + Hexagonal**.

## Estructura

*   `domain/`: **Entidades y Reglas de Negocio**. (No tocar sin aprobar cambio de diseño).
*   `application/`: **Casos de Uso**. (Orquestación).
*   `infrastructure/`: **Implementación Técnica** (Postgres, Supabase).

## Comandos

Ver `package.json` en la raíz para scripts de testing y migración.
