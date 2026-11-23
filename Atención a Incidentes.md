
---
# Runbook Operativo: Protocolo de Atención a Incidentes

| Campo                  | Valor                              |
| :--------------------- | :--------------------------------- |
| **Documento:**         | Protocolo de Atención a Incidentes |
| **Sistemas:**          | VoxStudio & Korus                  |
| **Plataforma Target:** | Render & Gmail                     |
| **Versión:**           | 1.0                                |
| **Autor:**             | Jonathan Kevin Arana Díaz          |
| **Aprobador:**         | Miguel Arturo Quiroz               |

---

## 1. Propósito y Alcance

Este documento establece el protocolo operativo estandarizado para la detección, clasificación, diagnóstico, escalación y resolución de incidentes técnicos que afecten la disponibilidad, rendimiento o seguridad de las plataformas VoxStudio y Korus. El objetivo principal consiste en restaurar la operación normal de los servicios en el menor tiempo posible, minimizando el impacto operativo al igual que documentando la causa raíz para prevenir su reincidencia.

---

## 2. Clasificación y Matriz de Severidad

Los incidentes se clasifican en tres niveles de severidad técnica según su impacto en la continuidad del negocio y el número de usuarios afectados:

| Nivel de Severidad     | Descripción e Impacto                                                                                                                                         | Tiempo de Respuesta (RTO Máximo) | Ejemplos de Eventos                                                                                                                                    |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1 - Crítico**       | Caída total del servicio en entorno productivo (`main`), indisponibilidad del motor de base de datos relacional o vulnerabilidad crítica de seguridad activa. |         **< 30 minutos**         | • Error HTTP 503 continuo en la API backend.<br>• Fallo de conexión insuperable en PostgreSQL.<br>• Exposición de credenciales de GCP/Azure.           |
| **P2 - Alto**          | Degradación severa del rendimiento, fallos recurrentes en trabajadores en segundo plano o errores HTTP 5xx superiores al 5% en desarrollo o producción.       |          **< 2 horas**           | • Latencia HTTP superior a 3000 ms.<br>• Fallo en la generación de audios de síntesis de voz.<br>• Agotamiento de conexiones en el pool de PostgreSQL. |
| **P3 - Medio / Menor** | Interrupción no crítica, fallos en ejecuciones de Integración Continua o advertencias de consumo de recursos sin afectación directa al usuario.               |          **< 24 horas**          | • Error de compilación en PR de rama `feature/*`.<br>• Advertencia de uso de RAM > 80% sin caída.<br>• Defectos menores de renderizado en el frontend. |

---

## 3. Arquitectura de Alertas Automatizadas

El sistema de observabilidad nativo de Render emite alertas automáticas mediante **Webhooks HTTP** dirigidos hacia un canal dedicado de monitoreo en Gmail:

### Eventos Notificados Automáticamente:

1. **Deploy Failed:** Notificación inmediata ante la falla de compilación o arranque de un contenedor en Render.
2. **Service Down:** Disparo de alerta cuando una instancia no responde a las pruebas de salud y entra en estado inactivo.
3. **High Resource Consumption:** Advertencia automática cuando la memoria RAM o el uso de CPU superan el umbral del 85% durante más de 5 minutos continuos.

---

## 4. Flujo de Diagnóstico y Triaje Paso a Paso

Ante la recepción de una alerta o reporte de incidente, el operador debe seguir de manera estricta la siguiente secuencia de triaje:

```
+-----------------------+      +-----------------------+      +-----------------------+
|  1. Notificación /    | ---> |  2. Diagnóstico en    | ---> |  3. Ejecución de      |
|  Recepción de Alerta  |      |  Render (Logs/RAM)    |      |  Contención / Fix     |
+-----------------------+      +-----------------------+      +-----------------------+
                                                                          |
                                                                          v
+-----------------------+      +-----------------------+      +-----------------------+
|  6. Cierre e Informe  | <--- |  5. Verificación      | <--- |  4. Escalación según  |
|  Post-Mortem          |      |  Post-Resolución      |      |  ADR-003 (Lead/Dev)   |
+-----------------------+      +-----------------------+      +-----------------------+
```

### Paso 1: Confirmación e Inspección Inicial

1. Acceder al canal  y validar la firma al igual que el mensaje del webhook.
2. Ingresar al Dashboard de Render  y verificar el indicador de estado del servicio.

### Paso 2: Análisis de Registros en Tiempo Real

1. Abrir la pestaña **Logs** del servicio afectado dentro de la consola de Render.
2. Aplicar filtros de búsqueda por palabra clave (ej. `ERROR`, `Exception`, `Connection refused`, `OutOfMemory`).
3. Aislar la causa raíz del problema:
    - **Fallo de aplicación:** Traza de excepción en el código.
    - **Fallo de base de datos:** Errores del tipo `FATAL: remaining connection slots are reserved` o recortes de tiempo de espera.
    - **Fallo de memoria:** Evento Out Of Memory registrado por el sistema operativo de Render.

### Paso 3: Inspección de Métricas Operativas

1. Consultar la pestaña **Metrics** en Render para revisar las gráficas de:
    - **CPU Usage:** Verificar si existieron picos inusuales de procesamiento.
    - **Memory Usage:** Evaluar posibles fugas de memoria.
    - **HTTP Latency & Request Count:** Confirmar saturación o denegación de servicio.

---

## 5. Protocolo de Escalación y Gobernanza

De acuerdo con el esquema de responsabilidades:

- **Residente DevOps (Nivel 1):**
    - Atiende y resuelve de manera autónoma incidentes clasificadas como **P3** o fallos en el ambiente de desarrollo (`develop`).
    - Ejecuta el diagnóstico inicial y redacta la ficha del incidente.
    - Si un incidente en desarrollo se cataloga como **P2** o **P1**, notifica de inmediato al Lead Técnico compartiendo las trazas de error de Render.
- **Lead Técnico (Nivel 2 / Autoridad de Diseño):**
    - Asume de forma exclusiva la gestión de incidentes **P1** o **P2** que afecten al entorno de producción (`main`).
    - Toma la decisión operativa de autorizar una reversión de código (**Runbook de Rollback - `rollback-runbook.md`**) o una restauración de base de datos por PITR (**Runbook de Restauración - `restore-runbook.md`**).
    - Administra las credenciales y ajustes de infraestructura para restablecer la operación.

---

## 6. Procedimiento de Resolución según Escenario

- **Escenario A: Error introducido por un despliegue reciente:**
    - Invocar inmediatamente la reversión de empaquetado en Render siguiendo el **Runbook de Rollback**.
- **Escenario B: Corrupción o pérdida de datos en PostgreSQL:**
    - Desplegar el protocolo de recuperación por Point-in-Time Recovery detallado en el **Runbook de Restauración**
- **Escenario C: Bloqueo de memoria o congelamiento de proceso:**
    - Ejecutar la reinicialización del servicio desde la interfaz de Render.

---

## 7. Formulario de Registro Post-Mortem de Incidente

Todo incidente de severidad **P1** o **P2** requiere la elaboración de un informe _Post-Mortem_ en un plazo no mayor a 48 horas tras la resolución del evento:

|Campo de Informe|Registro Técnico|
|:--|:--|
|**ID de Incidente:**|INC-2026-XXXX|
|**Fecha y Hora de Inicio:**|DD/MM/AAAA - HH:MM UTC|
|**Fecha y Hora de Cierre:**|DD/MM/AAAA - HH:MM UTC|
|**Nivel de Severidad:**|**[ ] P1 - Crítico** \|
|**Servicio Afectado:**|`voxstudio-backend` / `voxstudio_db` / `korus-backend`|
|**Resumen del Incidente:**|Descripción breve del fallo observado y su impacto.|
|**Causa Raíz (Root Cause):**|Explicación técnica del origen del fallo (código, BD, memoria, etc.).|
|**Acción Correctiva Aplicada:**|Procedimiento ejecutado para solucionar el incidente (Rollback/Fix/Restart).|
|**Tiempo Real de Recuperación (RTO):**|XX minutos|
|**Medidas Preventivas:**|Acciones o refactorizaciones programadas para evitar la reincidencia.|
|**Firma del Lead Técnico:**|___________________________|
