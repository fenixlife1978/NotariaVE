# Estado de migración a escritorio — NotariaVE

Fecha: 2026-11-14  
Rama de trabajo: `desktop-sqlite-migration`  
Revisión: PR #1 en borrador. No fusionar todavía.

## Implementado

- Aplicación de escritorio Electron con preload aislado, `contextIsolation`, sandbox y `nodeIntegration: false`.
- SQLite local en el directorio de datos del usuario, fuera de la carpeta de instalación.
- Esquema versionado, WAL, `synchronous=FULL`, claves foráneas, busy timeout y `quick_check`.
- Administrador inicial local, contraseñas con scrypt y sal aleatoria, autenticación SQLite y sesión en memoria.
- Clientes, perfil profesional y criterios SAREN persistidos por IPC en SQLite.
- Expedientes: guardado del formulario completo y texto de trabajo, búsqueda por título/comparecientes, reapertura, revisiones y auditoría de creación/modificación.
- Respaldos: copia SQLite, manifiesto SHA-256, comprobación de integridad y relaciones, verificación de tablas y administrador activo.
- Restauración: selección local del respaldo, validación del manifiesto, copia de seguridad automática previa y reemplazo con recuperación del archivo anterior si falla la apertura. Falta probar este flujo en la aplicación Electron instalada.
- Importador legado: archivo JSON local, previsualización, deduplicación por ID/cédula/RIF, transacción SQLite y bitácora. Los datos demo conocidos se omiten por defecto, con opción expresa de incluirlos.
- Se creó la guía [Exportar datos anteriores](EXPORTAR-DATOS-ANTERIORES.md). La versión web antigua no guardaba borradores del editor en localStorage; el exportador cubre clientes, perfil y criterios.
- Se retiraron clientes y perfil ficticios de los valores iniciales. La tasa BCV empieza vacía/cero y el estimador se identifica como no oficial.
- Se desactivaron las llamadas Gemini y se retiró Express/Gemini del runtime. Google Fonts también fue eliminado.
- Copias y migración están reservadas al administrador local.

## Validación ejecutada

- Una ejecución de GitHub Actions correspondiente al commit `19283f253a18faa0602c49fddd47a57030caae81` aprobó:
  - 4 pruebas SQLite.
  - TypeScript.
  - Build de producción Vite.
  - Pruebas SQLite y TypeScript en Windows.
  - Generación del instalador NSIS x64 y subida del artefacto.
- Ese instalador se generó antes de incorporar el importador de datos legados y las últimas restricciones de respaldo. No debe tratarse como instalador final.
- Los últimos cambios de importación, datos iniciales vacíos y controles adicionales de backup necesitan una nueva ejecución CI.
- No se ha probado manualmente el instalador en un equipo Windows ni el ciclo completo de restauración/importación en Electron.
- Vercel no es runtime ni base de datos del producto. El check Vercel del repositorio no es criterio de aceptación para esta arquitectura.

## Pendiente — bloquea producción

1. Confirmar CI completo de los cambios más recientes y regenerar el instalador Windows.
2. Probar en Electron: crear expediente, guardar, cerrar, reabrir, editar y verificar revisión/auditoría.
3. Probar crear respaldo, mover juntos `.sqlite` y `.manifest.json`, restaurar y verificar datos.
4. Probar restauración fallida/interrumpida y confirmar recuperación del archivo previo.
5. Ejecutar exportación real desde el navegador anterior e importar en SQLite; revisar clientes, perfil y criterios antes de borrar o abandonar el origen.
6. Implementar adjuntos locales; preferible almacenar BLOB en SQLite para que formen parte de un único respaldo.
7. Completar administración de usuarios, cambio/restablecimiento de contraseñas, roles y permisos efectivos.
8. Añadir consultas externas optativas BCV/SAREN con fuente, fecha, caché y consentimiento, sin bloquear operaciones offline.
9. Revisar jurídicamente cada tasa, ordenanza y regla del estimador.
10. Pruebas manuales Windows: instalación limpia, actualización conservando DB, modo avión, cierre inesperado, backup/restore y desinstalación conservando datos.

## Dictamen

**Migración en curso; todavía no apto para producción profesional.** La base de escritorio, autenticación local, expedientes, respaldos y ruta de importación ya están implementados en código. Falta confirmar CI de los últimos cambios, pruebas funcionales reales en Windows y completar usuarios/roles y adjuntos. No fusionar ni publicar todavía.
