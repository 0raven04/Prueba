
---
# Runbook Operativo: Proceso de Despliegue (Deployment)

| Campo                  | Valor                           |
| :--------------------- | :------------------------------ |
| **Documento:**         | Runbook Operativo de Despliegue |
| **Sistemas:**          | VoxStudio & Korus               |
| **Plataforma Target:** | Render & GitHub Actions         |
| **Versión:**           | 1.0                             |
| **Autor:**             | Jonathan Kevin Arana Díaz       |
| **Aprobador:**         | Miguel Arturo Quiroz            |

---

## 1. Propósito y Alcance

Este documento establece la guía técnica estandarizada paso a paso para ejecutar el proceso de despliegue de código e infraestructura en los productos VoxStudio al igual que Korus. El objetivo principal radica en garantizar lanzamientos reproducibles, seguros y libres de degradación operativa, distinguiendo formalmente las acciones ejecutadas en el ambiente de desarrollo frente a las liberaciones sobre el entorno productivo.

---

## 2. Modelo de Seguridad y Roles

De acuerdo con la restricción transversal de seguridad estipulada, el proceso de despliegue respeta una estricta separación de responsabilidades entre el equipo de desarrollo al igual que la Autoridad de Diseño:

* **Residente DevOps / Desarrolladores:**
  * Preparan, construyen y prueban cambios exclusivamente en el ambiente de desarrollo (`develop`) utilizando datos sintéticos.
  * Configuran los archivos de flujo de trabajo `.github/workflows/*.yml` y las plantillas declarativas `render.yaml`.
  * Generan la Solicitud de Extracción (*Pull Request*) hacia la rama destino y redactan la documentación asociada.
* **Lead Técnico (Autoridad de Diseño):**
  * Revisa y otorga la aprobación formal obligatoria sobre cada Pull Request.
  * Administra las claves de API (Google Cloud Storage, Azure y Gemini) además de la variable `DATABASE_URL`.
  * Ejecuta de forma exclusiva cualquier acción o fusión que afecte al entorno de producción.

---

## 3. Lista de Verificación Pre-Despliegue

Antes de iniciar la fase de despliegue, el operador o responsable del cambio debe verificar el cumplimiento de los siguientes puntos de control:

- [ ] **Sincronización de Ramas:** La rama de origen (`feature/*` o `fix/*`) se encuentra actualizada respecto a la rama destino (`develop` o `main`).
- [ ] **Validación de CI:** El pipeline de Integración Continua en GitHub Actions se ha ejecutado satisfactoriamente, mostrando el *status check passing*.
- [ ] **Inspección de Secretos:** Se ha confirmado la ausencia total de credenciales, tokens o llaves privadas en texto plano dentro del código fuente.
- [ ] **Revisión de Código:** Se cuenta con al menos una aprobación formal del Lead Técnico en la interfaz de GitHub.
- [ ] **Conversaciones Resueltas:** Todas las observaciones planteadas durante la revisión del Pull Request han sido atendidas y marcadas como resueltas.

---

## 4. Procedimiento de Despliegue en Desarrollo

### Paso 1: Envío de cambios y apertura del Pull Request
1. El desarrollador envía los *commits* validados localmente hacia la rama de trabajo distante:
```bash
   git push origin feature/nueva-funcionalidad
```

2. Acceder al repositorio en GitHub y crear un Pull Request teniendo como rama base a `develop`.

### Paso 2: Ejecución del Pipeline de Integración Continua

1. Al abrir el Pull Request, GitHub Actions dispara automáticamente la canalización correspondiente:
    - **Backend :** Ejecuta la compilación y empaquetado seguro.
    - **Frontend:** Ejecuta la instalación limpia, el análisis estático  al igual que la construcción del artefacto.
2. Confirmar que los _status checks_ obligatorios muestren el estado exitoso.

### Paso 3: Revisión y Fusión

1. El Lead Técnico revisa los cambios propuestos en la pestaña _Files changed_.
2. Una vez otorgada la aprobación, el Lead Técnico ejecuta la fusión hacia la rama `develop`.

### Paso 4: Aprovisionamiento y Despliegue Automatizado en Render

1. Render detecta el nuevo commit en la rama `develop` y desencadena la reconstrucción del servicio configurado en el Blueprint `render.yaml`.
2. La plataforma compila el contenedor o ejecutable y realiza el cambio progresivo de instancias.

---

## 5. Procedimiento de Despliegue en Producción

> **ATENCIÓN:** Los despliegues a producción son ejecutados de manera exclusiva por el Lead Técnico.

1. **Apertura de PR de Liberación:** Se crea un Pull Request desde la rama `develop` hacia la rama `main`.
2. **Verificación de Reglas de Protección:** El sistema valida que no existan _force pushes_, que la rama esté actualizada y que el pipeline pase en verde.
3. **Inyección de Secretos:** El Lead Técnico verifica que las variables de entorno de producción se encuentren configuradas correctamente en el panel de Render.
4. **Autorización y Merge:** El Lead Técnico aprueba y fusiona el PR sobre la rama `main`.
5. **Liberación en Render:** Render despliega los servicios web al igual que los trabajadores en segundo plano apuntando a la infraestructura relacional de producción.

---

## 6. Verificación Post-Despliegue y Pruebas de Humo

Una vez completada la fase de sincronización en Render, se deben llevar a cabo las siguientes validaciones operativas:

### 1. Inspección de Logs en Tiempo Real

Acceder al Dashboard de Render, seleccionar el servicio desplegado y consultar la pestaña **Logs** para verificar la ausencia de excepciones durante el arranque:

```
INFO  [main] c.v.VoxStudioApplication : Started VoxStudioApplication in 4.123 seconds (JVM running for 4.89)
```

### 2. Comprobación de Salud

Render evalúa automáticamente el estado de salud de la instancia. Confirmar que el servicio reporte el estado **Deployed** en color verde. Si una instancia no responde a las pruebas de salud durante 60 segundos, la plataforma iniciará un reinicio automático del recurso.

### 3. Pruebas de Humo
- Probar la disponibilidad del endpoint de verificación de salud en la API backend: `GET /actuator/health` o `GET /api/v1/status`.
- Navegar por la interfaz frontend en el subdominio de Render para validar el cargado de activos estáticos y la conexión con el backend.

---

## 7. Plan de Contingencia Inmediata

Si durante la verificación post-despliegue se detecta una degradación severa del servicio, errores 5xx recurrentes o fallos en la base de datos relacional:

1. **Detener las modificaciones adicionales** sobre el repositorio de GitHub.
2. Invocación inmediata del protocolo de reversión documentado en el **Runbook de Rollback.
3. Notificar el evento en el canal de incidentes correspondiente siguiendo las pautas de observabilidad.