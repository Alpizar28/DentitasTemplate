# 🗺️ Roadmap del Panel Administrativo - DentistasApp

Este documento detalla los pasos estratégicos para convertir el panel administrativo actual en una herramienta de gestión clínica completa y profesional.

---

## 🚀 Fase 1: Motor de Datos Real (Sincronización)
*Objetivo: Que el doctor gestione pacientes y citas reales, no simulados.*

- [ ] **Integración de Base de Datos:** Sustituir los datos de prueba en `/admin/dashboard` por consultas reales a la tabla `bookings` de Supabase.
- [ ] **Acciones de Estado:** Implementar Server Actions para que los botones "Confirmar" y "Cancelar" actualicen el campo `status` en la base de datos en tiempo real.
- [ ] **Cálculo de Métricas:** Desarrollar funciones SQL para obtener el total de citas diarias e ingresos mensuales de forma automática.

## 👥 Fase 2: CRM de Pacientes (Gestión de Fichas)
*Objetivo: Centralizar la información de contacto y salud de cada paciente.*

- [ ] **Directorio Inteligente:** Tabla paginada con búsqueda por nombre, email o teléfono.
- [ ] **Perfil del Paciente:** Vista detallada de cada persona con su historial completo de citas.
- [ ] **Notas Clínicas:** Espacio para que el doctor guarde diagnósticos o seguimientos privados asociados a cada reserva.

## 📅 Fase 3: Centro de Agendamiento Avanzado
*Objetivo: Optimizar la visualización de la carga de trabajo.*

- [ ] **Vista de Calendario:** Implementar una interfaz de calendario interactiva (Semanal/Mensual).
- [ ] **Reserva Manual:** Permitir la creación de citas directamente desde el panel (ej. para llamadas telefónicas).
- [ ] **Bloqueo de Horas:** Funcionalidad para marcar periodos de tiempo como no disponibles (festivos, descansos).

## ⚙️ Fase 4: Control de Configuración Clínica
*Objetivo: Dar autonomía al administrador sin necesidad de programar.*

- [ ] **Gestor de Servicios:** Interfaz para añadir/editar tipos de tratamientos, precios y duraciones estimadas.
- [ ] **Horarios Flexibles:** Control total sobre las horas de apertura, cierre y tiempos de descanso.
- [ ] **Branding e Información:** Actualizar datos de contacto, redes sociales y logotipos de la clínica.

## 📊 Fase 5: Analytics y Reportes de Crecimiento
*Objetivo: Analizar el rendimiento del negocio.*

- [ ] **Ranking de Tratamientos:** Visualización de cuáles son los servicios más rentables y solicitados.
- [ ] **Estadísticas de Asistencia:** Medir la tasa de "No-Show" (pacientes que no asisten) para mejorar recordatorios.
- [ ] **Exportación Profesional:** Botón para generar reportes en Excel/PDF para contabilidad o gestión externa.

---

> *Este plan está diseñado para ser implementado de forma modular, asegurando estabilidad y valor en cada entrega.*
