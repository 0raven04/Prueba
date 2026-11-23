
---
# Runbook Operativo: Proceso de Restauración de Base de Datos

| Campo                  | Valor                                 |
| :--------------------- | :------------------------------------ |
| **Documento:**         | Runbook Operativo de Restauración     |
| **Sistemas:**          | VoxStudio & Korus                     |
| **Plataforma Target:** | Render Postgres & Dashboard de Render |
| **Versión:**           | 1.0                                   |
| **Autor:**             | Jonathan Kevin Arana Díaz             |
| **Aprobador:**         | Miguel Arturo Quiroz                  |

---

## 1. Propósito y Alcance

Este documento establece el procedimiento técnico estandarizado para la recuperación y restauración de las bases de datos relacionales PostgreSQL en Render para VoxStudio  y Korus. La guía abarca el uso de la técnica **Point-in-Time Recovery (PITR)**, la verificación de integridad de datos al igual que el protocolo de auditoría de los tiempos de **RTO (Recovery Time Objective)** y **RPO (Recovery Point Objective)**.

---

## 2. Política y Cobertura de Respaldos (Render Postgres)

La infraestructura administrada de Render Postgres proporciona mecanismos automáticos de resiliencia sustentados en dos niveles de seguridad:

* **Respaldos Lógicos Diarios:** Render genera exportaciones lógicas automatizadas cada 24 horas con una ventana de retención de 7 días.
* **Archivado Continuo de Registros WAL (Write-Ahead Logging):** Se guardan de forma continua los registros WAL en almacenamiento redundante. Esto permite ejecutar una restauración Point-in-Time Recovery (PITR) a cualquier segundo específico dentro del periodo de retención de respaldos, garantizando un **RPO menor a 10 minutos**.
* **Aislamiento:** Las pruebas de restauración y simulacros periódicos se ejecutan exclusivamente sobre el ambiente de desarrollo utilizando esquemas con datos sintéticos ficticios, evitando exponer o manipular volúmenes de producción.

---

## 3. Modelo de Gobernanza y Autorización

* **Entorno de Desarrollo:** Solicitar e iniciar simulacros de restauración PITR sobre `voxstudio_db_develop` para auditar los tiempos de recuperación al igual que validar la consistencia del sembrado sintético.
* **Entorno de Producción:** La ejecución de una restauración sobre la base de producción, el intercambio de cadenas de conexión y la eliminación de instancias temporales de recuperación son facultades exclusivas del **Lead Técnico**.

---

## 4. Protocolo Paso a Paso de Restauración Point-in-Time Recovery (PITR)

> **MECANISMO DE RENDER:** La función de restauración por PITR en Render **nunca sobrescribe la base de datos relacional existente**. En su lugar, el sistema aprovisiona un recurso relacional completamente nuevo e independiente cargado con el estado exacto de los datos en el timestamp seleccionado.

### Paso 1: Determinación del Timestamp de Recuperación
1. Identificar el momento exacto (fecha, hora, minuto y segundo en formato UTC) previo a la falla, corrupción o incidente de datos.
2. Confirmar que el timestamp objetivo se encuentre dentro del rango de retención permitido (últimos 7 días).

### Paso 2: Ejecución de la Restauración desde la Consola de Render
1. Iniciar sesión en el Dashboard de Render (`dashboard.render.com`).
2. Seleccionar el servicio de base de datos relacional afectado (ej. `voxstudio_db_develop`).
3. Navegar a la pestaña **Restores** o **Backups** dentro de la navegación lateral del servicio.
4. Hacer clic en **Point-in-Time Recovery** o seleccionar la opción **Restore to Point in Time**.
5. Ingresar los parámetros de la nueva instancia:
   * **Target Timestamp:** Especificar la fecha y hora exacta deseada (ej. `2026-10-20 14:30:00 UTC`).
   * **Instance Name:** Asignar un identificador temporal claro (ej. `voxstudio-db-develop-restore-pitr`).
6. Confirmar la operación. Render comenzará a aprovisionar la nueva instancia y aplicar los registros WAL correspondientes.

---

## 5. Validación de Integridad de Datos y Medición de Métricas

Una vez que la nueva base de datos clonada reporte el estado **Available** en la consola de Render:

### 1. Extracción de Credenciales Temporales
Obtener la variable `Internal Database URL` o `External Database URL` de la nueva instancia en la pestaña **Info** de Render.

### 2. Inspección de Esquema y Datos Sintéticos
Conectarse a la instancia recuperada mediante `psql` o un cliente de administración de bases de datos:
```bash
psql "postgres://user:password@host-restaurado.render.com/voxstudio_db_develop"
````

Ejecutar las consultas de validación de consistencia relacional:

```
-- Verificar disponibilidad de tablas principales
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Confirmar la presencia y validez del último registro válido sintético
SELECT COUNT(*) FROM proyectos_doblaje;
```

### 3. Registro de Tiempos de Auditoría (RTO y RPO)

- **Recovery Time Objective (RTO):** Calcular el tiempo transcurrido desde el inicio de la orden de restauración en el tablero hasta que la nueva base estuvo 100% operativa y validada (tiempo medio alcanzado en simulacros: ~18 minutos).
- **Recovery Point Objective (RPO):** Verificar la diferencia entre el timestamp solicitado y el último registro recuperado (diferencia esperada: < 10 minutos).

---

## 6. Procedimiento Post-Restauración y Limpieza

Una vez concluida la validación de integridad, el Lead Técnico determinará el curso de acción según el escenario operacional:

### Escenario A: Reemplazo Definitivo por Falla Crítica (Cutover)

1. Copiar la nueva cadena de conexión (`DATABASE_URL`) de la instancia restaurada.
2. Acceder al servicio backend (`voxstudio-backend` o `korus-backend`) en Render.
3. Actualizar la variable de entorno `DATABASE_URL` apuntando al nuevo recurso.
4. Reiniciar los servicios web al igual que los trabajadores en segundo plano para aplicar la nueva conexión.
5. Una vez verificado el correcto funcionamiento, desaprovisionar la instancia antigua dañada.

### Escenario B: Conclusión de Simulacro de Auditoría

1. Registrar los resultados en la **Ficha de Auditoría de Restauración**.
2. Proceder a la eliminación inmediata de la instancia temporal `voxstudio-db-develop-restore-pitr` desde el tablero de Render para evitar consumo innecesario de recursos.

---

## 7. Formulario de Auditoría de Restauración

|Campo de Auditoría|Registro de Evidencia|
|:--|:--|
|**Fecha del Simulacro:**|DD/MM/AAAA|
|**Instancia Origen:**|`voxstudio_db_develop`|
|**Instancia Clonada:**|`voxstudio-db-develop-restore-pitr`|
|**Timestamp Solicitado (UTC):**|AAAA-MM-DD HH:MM:SS|
|**Hora de Inicio de Restauración:**|HH:MM:SS|
|**Hora de Conclusión y Validación:**|HH:MM:SS|
|**RTO Obtenido:**|XX minutos|
|**RPO Obtenido:**|XX minutos|
|**Estado de Integridad:**|**[ ] Aprobado** \|
|**Firma del Lead Técnico:**|___________________________|
