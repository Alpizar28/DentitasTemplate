# Módulo 1: Core Domain & Booking Engine - Diseño Arquitectónico

> [!IMPORTANT]
> Este documento define el **Core Innegociable** del sistema. No incluye detalles de implementación de UI, Pagos o Notificaciones.

## 1. Plan Paso a Paso (Conceptual)

Este plan establece el orden lógico de definición para asegurar que el núcleo sea sólido y agnóstico.

### Fase 1: Definición del Espacio-Tiempo (The "Playground")
**Objetivo:** Definir cómo se representa el tiempo y los recursos antes de siquiera hablar de reservas.
1.  **Definir la Unidad Atómica de Tiempo (TimeSlot vs TimeRange):** Determinar si el sistema es "slotted" (turnos fijos de 30m) o "granular" (cualquier rango de minutos). *Decisión: Soportar ambos mediante TimeRange [Start, End) en UTC estricto.*
2.  **Definir la Identidad del Recurso:** Abstraer "Silla de barbero", "Cancha de tenis" y "Psicólogo" en una entidad `Resource` agnóstica de capacidad 1.
3.  **Definir las Reglas de Operación (AvailabilityRule):** Horarios de apertura y cierre base, independientemente de las reservas.

### Fase 2: El Modelo de Reserva (The "Contract")
**Objetivo:** Modelar la intención de reserva y su ciclo de vida.
1.  **Definir la Entidad `Booking`:** Separarla de los datos del cliente usuario (identity). La reserva "posee" un slot de tiempo sobre un recurso.
2.  **Máquina de Estados Finita (FSM):** Definir estados estrictos (`PENDING`, `HELD`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`).
3.  **Inmutabilidad Histórica:** Una reserva confirmada no se "edita"; se cancela y se crea una nueva (conceptualmente) o se versiona para mantener auditoría.

### Fase 3: Motor de Disponibilidad (The "Calculator")
**Objetivo:** Responder a la pregunta "¿Puedo reservar esto?" sin condiciones de carrera.
1.  **Separación de Lectura/Escritura:** La disponibilidad es el resultado de `(Configuración - Reservas - Bloqueos)`. No se debe persistir la "disponibilidad" como un record editable, se debe calcular o usar vistas materializadas reactivas.
2.  **Definir `AvailabilityQuery`:** Un input estandarizado (time range, resource criteria) que retorna Slots Libres.

### Fase 4: Estrategia de Concurrencia (The "Traffic Cop")
**Objetivo:** Evitar Double Booking y Race Conditions.
1.  **Implementación del "Hold" (Bloqueo Temporal):** Un mecanismo de reserva efímera (TTL corto) que garantiza el slot mientras se completan pasos secundarios (validación de reglas, captcha, etc.).
2.  **Constraints de Base de Datos:** Uso de `TSTZRANGE` con exclusión (`&&`) en Postgres como última línea de defensa.

### Fase 5: Validaciones del Core (The "Gatekeeper")
**Objetivo:** Asegurar que nadie rompa las reglas del dominio.
1.  **Invariantes de Dominio:** "Una reserva no puede terminar antes de empezar", "Una reserva no puede existir sin recurso o servicio".
2.  **Validación de Solapamiento:** Verificación lógica antes del insert.

---

## 2. Modelo Mental del Core Booking Engine

Imagina el sistema como un **Tetris Multidimensional**.

1.  **El Tablero (Resources):** Son las columnas donde caen las piezas. Un negocio puede tener N tableros (10 canchas) o 1 tablero (1 consultorio).
2.  **Las Piezas (Bookings):** Son bloques de tiempo que ocupan espacio en el tablero. Tienen dimensiones (duración) y posición (start_time).
3.  **La Grilla (Availability Rules):** Define dónde *existe* tablero. Si el negocio cierra a las 18:00, no hay tablero después de esa hora. Intentar poner una pieza ahí es imposible.
4.  **El Árbitro (Booking Engine):**
    *   No le importa quién juega (Cliente).
    *   No le importa cuánto pagó.
    *   Solo verifica: "¿Cabe esta pieza aquí sin chocar con otra y dentro de los límites de la grilla?".
5.  **El "Hold" (La pieza fantasma):** Cuando un usuario selecciona un horario, aparece una "pieza fantasma" gris. Nadie más puede poner una pieza ahí. Si el usuario no confirma en 10 minutos, la pieza fantasma desaparece. Si confirma, se vuelve sólida.

**Relaciones Clave:**
*   **Service** define la *forma* de la pieza (duración requerida).
*   **Resource** define la *columna* donde va.
*   **Booking** instancia la pieza en una coordenada específica.

---

## 3. Decisiones Críticas

### A. Agnosticismo de Identidad (Resource ID vs Type)
*   **Decisión:** El Core no sabe qué es un "Dentista". Solo conoce `ResourceID` y `ResourceType`.
*   **Por qué:** Si hardcodeamos `doctor_id`, el sistema no sirve para canchas de fútbol. La metadata descriptiva (Nombre, Especialidad) vive en otro módulo o tabla extendida, no en el Core Log.

### B. Disponibilidad Calculada vs Persistida
*   **Decisión:** La disponibilidad se calcula en tiempo real (o cacheada) mediante sustracción: Total - Ocupado.
*   **Por qué:** Persistir "slots libres" es propenso a errores de sincronización. Si borrás una reserva manualmente y olvidas actualizar el contador de "slots libres", el sistema queda corrupto. La fuente de verdad son las Reservas Existentes.

### C. Uso de TSTZRANGE (Postgres)
*   **Decisión:** Usar tipos de rango nativos de base de datos para `start_time` y `end_time`.
*   **Por qué:** Permite usar operadores de exclusión (`&&`) nativos para prevenir overbooking a nivel de motor de BD, garantizando integridad cero-costo.

### D. "Hold" como Estado de Reserva
*   **Decisión:** El bloqueo temporal (`HOLD`) es un estado de la misma tabla de reservas (o una tabla adjunta `booking_holds`), no un sistema separado en Redis (inicialmente).
*   **Por qué:** Mantiene la integridad referencial y simplifica la arquitectura para deploys aislados. Si el sistema se cae, el hold persiste o expira naturalmente por lógica SQL, sin depender de servicios volátiles externos en esta etapa base.

---

## 4. Riesgos si se diseña mal

### Errores Comunes y Tentaciones
1.  **"La trampa del Slot Fijo":** Asumir que todo el mundo opera en bloques de 1 hora.
    *   *Consecuencia:* No puedes vender turnos de 45 mins o 15 mins. El sistema se vuelve inútil para barberías o consultorios rápidos.
2.  **"Acoplameinto de Usuario":** Ligar la reserva directamente a la tabla `auth.users`.
    *   *Consecuencia:* No puedes hacer reservas para terceros ("Reservar para mi mamá") o reservas administrativas (bloquear horario por mantenimiento) sin crear usuarios falsos.
3.  **"Lógica en el Cliente":** Dejar que el Frontend decida si un horario está libre.
    *   *Consecuencia:* Race conditions masivas y overbooking garantizado.
4.  **Feature Creep de Pagos:** Poner `payment_status` dentro de la lógica de disponibilidad.
    *   *Consecuencia:* Un pago fallido bloquea un horario eternamente, o un pago exitoso no encuentra lugar. (La reserva debe asegurar el lugar *antes* del pago).

### Señales de Alerta Temprana
*   Si necesitas añadir un `IF type == 'padel'` en el Core, está mal diseñado.
*   Si cambiar la duración de un servicio requiere migración de base de datos, está mal diseñado.
*   Si borrar una reserva requiere ejecutar 3 scripts para limpiar "contadores", es frágil.

---

## 5. Checklist de Validación del Módulo 1

Antes de pasar al Módulo 2, el diseño debe responder **SÍ** a todo:

- [ ] **Prueba del Tenis:** ¿Puedo reservar una cancha (Recurso) por 1 hora exacta?
- [ ] **Prueba del Dentista:** ¿Puedo reservar un doctor (Recurso humano) por 20 minutos?
- [ ] **Prueba del Mantenimiento:** ¿Puedo bloquear un recurso todo el día sin que sea una "reserva de cliente"? (Reserva administrativa).
- [ ] **Prueba de la Concurrencia:** Si dos requests llegan en el mismo milisegundo para el mismo recurso/hora, ¿falla uno y gana el otro?
- [ ] **Prueba de la Amnesia:** Si borro todas las configuraciones de UI (colores, nombres), ¿la reserva sigue siendo válida lógicamente?
- [ ] **Prueba del Futuro:** Si mañana agregan "Reservas de Mesas de Restaurante", ¿tengo que cambiar la tabla `bookings`? (Debería ser NO, o mínimo).
- [ ] **Prueba de Integridad Timezone:** ¿El sistema maneja UTC internamente para evitar conflictos si el servidor y el negocio están en zonas distintas?
