# Estado de migración a escritorio — NotariaVE

Fecha de corte: 2026-11-14
Rama: `desktop-sqlite-migration`
PR de revisión: #1 (borrador; no fusionar)

## Implementado en esta fase

- Estructura inicial Electron con proceso principal y preload aislado.
- Ventana con `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`; navegación superior limitada a la app local.
- SQLite en el directorio de datos de la aplicación, fuera del directorio de instalación.
- Apertura de DB con WAL, synchronous FULL, foreign keys, busy timeout y `quick_check`.
- Migración inicial versionada con tablas de usuarios, clientes, documentos, configuración, auditoría, consultas externas y adjuntos.
- Primer administrador local; contraseña con scrypt y sal aleatoria; login verificado en SQLite; sesión en memoria, sin persistirla en el renderer.
- Clientes, perfil profesional y criterios SAREN ya leen/escriben a través de IPC SQLite.
- Eliminados datos de ejemplo de clientes y perfil profesional; el formulario documental ya no precarga identificaciones, domicilios, vehículos ni inmuebles ficticios.
- Retiradas llamadas Gemini del runtime de escritorio; botones de IA deshabilitados mientras no exista consentimiento explícito.
- Retirado Google Fonts; eliminado el servidor Express/Gemini y sus dependencias del runtime.
- Tasa BCV ficticia inicial retirada; el estimador requiere una tasa introducida manualmente y se identifica expresamente como no oficial.
- Pruebas Node iniciales para esquema, WAL, foreign keys y migración idempotente.
- Workflow GitHub Actions para pruebas SQLite, TypeScript y build Vite.

## Pendiente — bloquea la aprobación

1. Ejecutar CI y corregir cualquier error de instalación, TypeScript, pruebas y build. La ejecución todavía no está confirmada.
2. Persistir y recuperar documentos/expedientes completos desde SQLite; actualmente el esquema existe, pero la interfaz aún no ofrece ciclo completo de guardado, búsqueda y reapertura.
3. Gestión de usuarios adicionales, cambio/reset de contraseña, roles y permisos efectivos.
4. Adjuntos locales con escritura atómica, hashes y recuperación.
5. Copias de seguridad y restauración verificadas.
6. Importador de datos previos del navegador con exportación, previsualización, deduplicación y confirmación; nunca importar datos de demostración.
7. Migraciones futuras con backup previo y rollback.
8. Consultas optativas BCV/SAREN con fuente, fecha, caché local, expiración y consentimiento; ninguna consulta debe bloquear operaciones.
9. Revisión de cada regla tarifaria, ordenanza y referencia legal. El estimador se marca no oficial y no debe utilizarse como liquidación legal definitiva.
10. Pruebas reales en Windows: instalación limpia, actualización conservando DB, modo avión, cierre inesperado, backup/restore y desinstalación conservando datos.

## Verificación disponible

- Primer workflow GitHub Actions: falló en instalación de dependencias antes de ejecutar pruebas. Causa identificada: Vite 8.3.8 exige peer opcional esbuild ^0.27.0 o ^0.28.0 y el proyecto fijaba ^0.25.0. Se actualizó esbuild a ^0.28.2; queda pendiente confirmar una nueva ejecución completa.
- La ejecución fallida no alcanzó las pruebas SQLite, TypeScript ni build Vite.
- Revisión de código a través de GitHub; no se ejecutó en esta sesión una compilación local ni pruebas de escritorio.
- El estado Vercel observado en el commit de trabajo no es criterio de aceptación para este producto y no se usó como runtime ni base de datos.
- El PR #1 está en borrador y no está fusionado con `main`.

## Dictamen de fase

**Base técnica iniciada; producto todavía no apto para producción.** Ya existe el esqueleto de escritorio y la primera capa SQLite/autenticación/clientes/configuración, pero faltan persistencia completa de documentos, backups, usuarios/roles, importación y pruebas reales de distribución. No publicar ni fusionar todavía.
