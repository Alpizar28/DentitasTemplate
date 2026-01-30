# 🧱 TECH_STACK.md — BellBooking

## 📌 Propósito del documento

Este documento define el **stack tecnológico oficial** para el template **BellBooking**, un blueprint profesional para construir sistemas de reservas aislados por cliente (NO multi-tenant), con arquitectura limpia, extensible y mantenible a largo plazo.

El stack está diseñado para:
- Sistemas de reservas reales (salud, servicios, espacios, profesionales)
- Alta confiabilidad de datos
- Customización por cliente sin romper el core
- Evolución progresiva del dominio

Este stack es **obligatorio** para todas las implementaciones derivadas del template.

---

## 🧠 Principios Arquitectónicos Base

- **NO multi-tenant**
- **Un cliente = un repo + un deploy + una base de datos**
- Arquitectura **DDD + Hexagonal**
- Core desacoplado de infraestructura
- Reglas de negocio explícitas (no implícitas en UI o SQL)
- Configuración > Hardcode
- Seguridad por defecto

---

## 🗄️ Base de Datos

### Supabase (PostgreSQL)

**Rol:** Sistema de persistencia y seguridad

**Uso:**
- PostgreSQL como única fuente de verdad
- RLS (Row Level Security) activado por defecto
- Funciones SQL solo para lógica técnica (no reglas de dominio)
- Auditoría y trazabilidad activas

**Incluye:**
- Auth (usuarios, roles)
- Realtime (si aplica)
- Storage (opcional, desacoplado del core)
- Policies estrictas (principio de menor privilegio)

🚫 Prohibido:
- Lógica de negocio crítica dentro de triggers
- Hardcodear reglas por tipo de cliente
- SQL “inteligente” que oculte reglas

---

## 🧩 Backend / Core Domain

### Arquitectura: DDD + Hexagonal

**Capas obligatorias:**
- Domain (Entidades, Value Objects, Aggregates)
- Application (Use Cases / Commands / Queries)
- Ports (Interfaces)
- Adapters (Infraestructura)
- Config / Bootstrap

**Características:**
- Dominio puro (sin dependencias externas)
- Casos de uso explícitos (CreateBooking, CancelBooking, etc.)
- Reglas de negocio testeables y aisladas
- Infraestructura reemplazable

🚫 Prohibido:
- Acceder a Supabase directamente desde el dominio
- Saltarse el Application Layer
- Mezclar reglas con controladores o UI

---

## 🌐 Frontend

### Next.js (App Router)

**Rol:** Capa de presentación y orquestación de UX

**Uso:**
- App Router obligatorio
- Server Components por defecto
- Client Components solo cuando sea necesario
- loading.tsx y error.tsx obligatorios
- Skeletons y estados intermedios bien definidos

### UI / Styling
- Tailwind CSS
- Componentes desacoplados del dominio
- Diseño responsive y accesible
- Dark / Light mode opcional, no acoplado

🚫 Prohibido:
- Lógica de negocio en componentes
- Acceder directamente a la base de datos
- Hardcodear textos o reglas por cliente

---

## 🔐 Autenticación & Autorización

### Supabase Auth

**Modelo:**
- Auth ≠ Dominio
- Roles y permisos mapeados desde configuración
- Policies claras y auditable

**Ejemplos de roles:**
- Admin
- Staff
- Cliente final

🚫 Prohibido:
- Validar permisos solo en frontend
- Usar claves de servicio en cliente
- Mezclar auth con reglas de negocio

---

## ⚙️ Configuración del Negocio

### JSON / Bundle Config

**Uso:**
- Servicios ofrecidos
- Horarios
- Políticas de cancelación
- Reglas de reserva
- Feature toggles

**Principio clave:**
> El sistema se adapta al negocio, no al revés.

🚫 Prohibido:
- Condicionales por tipo de cliente en el core
- Configuración dispersa o implícita
- Modificar código para cambios de negocio comunes

---

## 🧪 Testing & Validación

### Tipos de pruebas esperadas:
- Unitarias (Dominio)
- Casos de uso (Application)
- Validación de reglas
- Conflictos de reserva

**Enfoque:**
- Probar reglas, no UI
- Casos límite explícitos
- Estados inválidos imposibles

---

## 📈 Performance & Escalabilidad

- Queries optimizadas
- Índices definidos
- Rate limiting en reservas
- Prevención de overbooking
- Control de concurrencia

🚫 Prohibido:
- Llamadas redundantes a API
- Refetch innecesario
- Dependencia de polling constante

---

## 🔍 Auditoría & Observabilidad

- Logs de acciones críticas
- Registro de cambios de estado
- Trazabilidad de reservas
- Errores controlados y explícitos

---

## 🚫 Decisiones Tecnológicas EXPLÍCITAMENTE EXCLUIDAS

- Multi-tenant
- WordPress / Wix / CMS genéricos
- ORM pesado que oculte queries
- Magic frameworks
- Hardcodeo por industria
- UI-driven business logic

---

## ✅ Resultado Esperado

Un sistema de reservas:
- Robusto
- Extensible
- Customizable por cliente
- Fácil de mantener
- Con reglas claras y auditables
- Preparado para producción real

Este stack **NO se negocia**.
