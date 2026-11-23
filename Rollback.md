
---

# Runbook Operativo: Proceso de Reversión

| Campo                  | Valor                          |
| :--------------------- | :----------------------------- |
| **Documento:**         | Runbook Operativo de Reversión |
| **Sistemas:**          | VoxStudio & Korus              |
| **Plataforma Target:** | Render & GitHub                |
| **Versión:**           | 1.0                            |
| **Autor:**             | Jonathan Kevin Arana Díaz      |
| **Aprobador:**         | Miguel Arturo Quiroz           |

---

## 1. Propósito y Alcance

Este documento define la guía procedimental estandarizada para ejecutar la reversión rápida de despliegues o actualizaciones defectuosas en los productos VoxStudio y Korus. El propósito central radica en restablecer la disponibilidad operativa en el menor tiempo posible, minimizando el impacto sobre los usuarios al igual que protegiendo la integridad de la base de datos relacional.

---

## 2. Criterios de Activación del Rollback

La ejecución del procedimiento de reversión es obligatoria e inmediata cuando se presente alguna de las siguientes condiciones en el entorno de producción o en el ambiente de desarrollo:

* **Tasa de Errores Elevada:** Incremento de errores HTTP 5xx superior al 5% en las peticiones recibidas durante los primeros 10 minutos post-despliegue.
* **Fallo en Health Checks:** Reinicios cíclicos de la instancia en Render debido a la incapacidad del servicio para responder al endpoint de verificación de salud.
* **Incompatibilidad de Esquema:** Incongruencia grave en las migraciones de PostgreSQL que impida la lectura o escritura de datos relacionales.
* **Degradación Severa de Rendimiento:** Aumento del tiempo de respuesta superior a 3000 ms en los endpoints críticos del backend.
* **Vulnerabilidad de Seguridad:** Detección de exposición accidental de secretos o credenciales en el empaquetado desplegado.

---

## 3. Modelo de Autorización y Gobernanza

De acuerdo con las restricciones de gobernanza

* **Ambiente de Desarrollo (`develop`):** El Residente DevOps o los desarrolladores pueden desencadenar la reversión de un despliegue o *commit* defectuoso, notificando inmediatamente al equipo.
* **Entorno de Producción (`main`):** Únicamente el **Lead Técnico** posee la facultad de autorizar y ejecutar el procedimiento de *rollback* sobre la infraestructura productiva.

---

## 4. Procedimiento de Rollback Inmediato en Render

Render conserva el historial de empaquetados de cada servicio, lo que permite realizar un *rollback* a una versión previa funcional en cuestión de segundos sin necesidad de compilar nuevamente el código fuente.

### Paso 1: Acceso al Tablero de Control
1. Iniciar sesión en el Dashboard de Render.
2. Seleccionar el espacio de trabajo y el servicio afectado.

### Paso 2: Selección del Despliegue Previo Funcional
1. Navegar a la pestaña **Events** o **Deploys** dentro de la consola del servicio.
2. Identificar el último despliegue exitoso (marcado con el indicador verde **Live** previo a la falla).
3. Hacer clic en el menú contextual de tres puntos (`...`) ubicado a la derecha del despliegue seleccionado.

### Paso 3: Invocación de Reversión
1. Seleccionar la opción **Rollback to this deploy**.
2. Confirmar la acción en la ventana emergente.
3. Render redirigirá el tráfico inmediatamente hacia la imagen o artefacto del despliegue anterior, manteniendo la disponibilidad mientras destruye la instancia defectuosa.

---

## 5. Procedimiento de Reversión en el Repositorio de Git

Una vez estabilizado el servicio en Render mediante el *rollback* de infraestructura, se debe corregir el historial del repositorio para mantener la concordancia del código.

### Opción A: Reversión mediante la Interfaz de GitHub
1. Acceder al repositorio en GitHub y navegar a la pestaña **Pull requests**.
2. Seleccionar la pestaña **Closed** y abrir el PR que provocó el fallo.
3. En la parte inferior del PR fusionado, hacer clic en el botón **Revert**.
4. GitHub generará automáticamente una nueva rama y un PR de reversión (ej. `revert-12-feature-audio`).
5. El Lead Técnico aprueba el PR de reversión, ejecutando la fusión para limpiar las ramas `develop` o `main`.

### Opción B: Reversión Local mediante Git CLI
Si se requiere revertir un commit específico desde la línea de comandos:

```bash
# 1. Posicionarse en la rama afectada y actualizar el historial
git checkout develop
git pull origin develop

# 2. Identificar el hash del commit defectuoso
git log --oneline -n 5

# 3. Crear un commit de reversión (sin alterar el historial anterior)
git revert <HASH_DEL_COMMIT_DEFECTUOSO>

# 4. Enviar el commit de reversión al repositorio remoto
git push origin develop
````

---

## 6. Rollback de Base de Datos y Datos Sintéticos

Si el despliegue defectuoso incluyó migraciones de esquema en PostgreSQL:

1. **Evaluación de Compatibilidad Inversa:** Verificar si los cambios en las tablas permiten el funcionamiento de la versión previa del código.
2. **Ambiente de Desarrollo (`develop`):** Si la estructura relacional quedó corrupta o inconsistente, ejecutar la limpieza y el re-sembrado de datos sintéticos no sensibles mediante el script oficial:
    
    ```
    psql -h <HOST_RENDER> -U <USER_DEVELOP> -d voxstudio_db_develop -f seed-develop.sql
    ```
    
3. **Entorno de Producción (`main`):** Si la base productiva sufrió pérdida o corrupción de datos, invocar de forma inmediata el **Runbook de Restauración (`restore-runbook.md`)** para iniciar el procedimiento Point-in-Time Recovery (PITR).

---

## 7. Verificación Post-Rollback y Cierre de Incidente

Una vez completado el procedimiento de reversión:

1. **Pruebas de Humo:** Confirmar el restablecimiento del endpoint de salud (`GET /actuator/health`) al igual que el cargado correcto de la interfaz web.
2. **Revisión de Logs:** Verificar que la tasa de errores HTTP en la pestaña **Logs** de Render haya retornado a 0%.
3. **Registro de Incidente:** Documentar las causas raíz del fallo en el protocolo de atención a incidentes (`incidents-runbook.md`) para evitar su recurrencia en futuros Sprints.