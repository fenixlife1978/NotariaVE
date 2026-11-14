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
- Expedientes/documentos: guardado y reapertura en SQLite, búsqueda por título y comparecientes, persistencia del formulario completo y texto editado, contador de revisiones y auditoría de creación/modificación.
- Eliminados datos de ejemplo de clientes y perfil profesional; el formulario documental ya no precarga identificaciones, domicilios, vehículos ni inmuebles ficticios.
- Retiradas llamadas Gemini del runtime de escritorio; botones de IA deshabilitados mientras no exista consentimiento explícito.
- Retirado Google Fonts; eliminado el servidor Express/Gemini y sus dependencias del runtime.
- Tasa BCV ficticia inicial retirada; el estimador requiere una tasa introducida manualmente y se identifica expresamente como no oficial.
- Pruebas Node iniciales para esquema, WAL, foreign keys y migración idempotente.
- Workflow GitHub Actions para pruebas SQLite, TypeScript y build Vite.

## Pendiente — bloquea la aprobación

1. Completar CI: una ejecución reciente instaló dependencias y pasó las 3 pruebas SQLite, pero TypeScript falló por tipos de registros de clientes y payload de documentos. Se corrigieron esos tipos; falta una nueva ejecución confirmatoria y build Vite.
2. Validar el ciclo de documentos en la aplicación Electron real: crear, guardar, cerrar, volver a abrir, editar y verificar el incremento de revisión. La capa IPC y la interfaz ya están implementadas; falta prueba funcional de escritorio.
3. Gestión de usuarios adicionales, cambio/reset de contraseña, roles y permisos efectivos.
4. Adjuntos locales con escritura atómica, hashes y recuperación.
5. Copias de seguridad y restauración verificadas.
6. Importador de datos previos del navegador con exportación, previsualización, deduplicación y confirmación; nunca importar datos de demostración.
7. Migraciones futuras con backup previo y rollback.
8. Consultas optativas BCV/SAREN con fuente, fecha, caché local, expiración y consentimiento; ninguna consulta debe bloquear operaciones.
9. Revisión de cada regla tarifaria, ordenanza y referencia legal. El estimador se marca no oficial y no debe utilizarse como liquidación legal definitiva.
10. Pruebas reales en Windows: instalación limpia, actualización conservando DB, modo avión, cierre inesperado, backup/restore y desinstalación conservando datos.

## Verificación disponible

- Primer workflow GitHub Actions: falló en instalación de dependencias porque Vite 8.3.8 exigía esbuild ^0.27.0 o ^0.28.0; se actualizó a ^0.28.2.
- Siguiente ejecución: instalación correcta y 3/3 pruebas SQLite aprobadas. TypeScript falló en tipos de clientes y payload de documentos; se corrigieron las declaraciones y falta confirmar una nueva ejecución. La compilación Vite quedó omitida por el fallo previo de TypeScript.
- Revisión de código a través de GitHub; no se ejecutó en esta sesión una compilación local ni pruebas de escritorio.
- El estado Vercel observado en el commit de trabajo no es criterio de aceptación para este producto y no se usó como runtime ni base de datos.
- El PR #1 está en borrador y no está fusionado con `main`.

## Dictamen de fase

**Base técnica iniciada; producto todavía no apto para producción.** Ya existe el esqueleto de escritorio y la primera capa SQLite/autenticación/clientes/configuración, pero faltan persistencia completa de documentos, backups, usuarios/roles, importación y pruebas reales de distribución. No publicar ni fusionar todavía.
