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
- Usuarios y roles: administración local de cuentas, creación, activación/desactivación, cambio de perfil y restablecimiento de contraseña. Contraseñas scrypt con sal aleatoria. Permisos verificados en el proceso principal de Electron: administrador, abogado, asistente y solo consulta. La política de autorización y la protección contra auto-bloqueo/eliminación del último administrador se aislaron en `electron/access-policy.cjs` y tienen pruebas unitarias de regresión.
- Adjuntos: migración de esquema v3 y almacenamiento BLOB dentro de SQLite; listado por expediente/cliente, exportación con verificación SHA-256 y eliminación auditada. Límite 20 MB y lista permitida de formatos PDF, Office/ODT/RTF/TXT e imágenes JPG/PNG/WebP.
- Interfaz de administración de usuarios y de adjuntos integrada. La navegación de configuración/usuarios se limita visualmente al administrador; los controles críticos también se validan en Electron.
- Frontera IPC reforzada: todos los canales se registran mediante un guard común que rechaza emisores distintos de la ventana principal y frames cuyo origen no coincide con el renderer local empaquetado (`file://`) o el servidor loopback de desarrollo (`127.0.0.1:5173`).
- Atomicidad de datos y auditoría: guardado/actualización de clientes y expedientes, adjuntos, parámetros y administración inicial vinculan la mutación con su evento de auditoría en una misma transacción SQLite. La eliminación de clientes se bloquea si conservan adjuntos, para evitar archivos huérfanos.
- Reemplazo de respaldos: la creación ya no destruye primero un respaldo anterior del mismo nombre; desplaza temporalmente el par SQLite/manifiesto y lo recupera si falla la instalación del nuevo. La limpieza del respaldo desplazado es no fatal.
- Se reconstruyó el encabezado, que CI había detectado con sintaxis JSX rota en un commit anterior.
- Se creó la guía [Exportar datos anteriores](EXPORTAR-DATOS-ANTERIORES.md). La versión web antigua no guardaba borradores del editor en localStorage; el exportador cubre clientes, perfil y criterios.
- Se retiraron clientes y perfil ficticios de los valores iniciales. La tasa BCV empieza vacía/cero y el estimador se identifica como no oficial.
- Se desactivaron las llamadas Gemini y se retiró Express/Gemini del runtime. Google Fonts también fue eliminado.
- Copias y migración están reservadas al administrador local.

## Validación ejecutada

- GitHub Actions, ejecución `43643622165`, commit `d044c6a8d46633d0a4a090d9ce5ff5ef3d08294f`, terminó con ambos jobs en **success**:
  - 7 pruebas SQLite aprobadas.
  - TypeScript `tsc --noEmit`.
  - Build de producción Vite.
  - Pruebas SQLite y TypeScript en Windows.
  - Generación del instalador NSIS x64 y subida del artefacto `NotariaVE-Windows-Installer`.
- Artefacto de ese commit: ID `14133441505`, 149 MB, SHA-256 `72c3d32158ed2a1dcaa07d6673b1da0a4abede75c6b36f420b759b9e56783e08`. [Abrir artefacto en GitHub Actions](https://github.com/fenixlife1978/NotariaVE/actions/runs/43643622165/artifacts/14133441505).
- Después se añadió protección adicional para impedir que una ruta de respaldo/restauración use un hardlink de la base SQLite activa, además de rutas equivalentes por mayúsculas/minúsculas en Windows. Se incorporó una prueba de regresión para esa protección.
- La ejecución `43646265233` para el commit `7bd75e590edbafec51a17911cfd23335b79b1974` aprobó validación, pruebas SQLite en Windows y TypeScript; al último chequeo el empaquetado NSIS seguía en curso y aún no había artefacto. Después se agregaron helpers de autorización y pruebas adicionales; esos commits requieren una ejecución CI completa propia antes de aceptar el paquete.
- No se ha instalado ni probado manualmente el instalador en un equipo Windows. Tampoco se ha ejecutado el ciclo real de importación/restauración desde la interfaz Electron.
- Vercel no es runtime ni base de datos del producto. El check Vercel no es criterio de aceptación para esta arquitectura de escritorio.

## Pendiente — bloquea producción

1. Esperar el resultado de CI `43645133698`; si aprueba, conservar y verificar el nuevo instalador Windows.
2. Probar en Electron: crear expediente, guardar, cerrar, reabrir, editar y verificar revisión/auditoría.
3. Probar crear respaldo, mover juntos `.sqlite` y `.manifest.json`, restaurar y verificar datos.
4. Probar restauración fallida/interrumpida y confirmar recuperación del archivo previo.
5. Ejecutar exportación real desde el navegador anterior e importar en SQLite; revisar clientes, perfil y criterios antes de borrar o abandonar el origen.
6. Probar importación, exportación, integridad SHA-256 y restauración de adjuntos reales en Windows.
7. Probar manualmente los cuatro perfiles y confirmar que las operaciones no autorizadas son rechazadas por IPC. Las pruebas unitarias de política ya cubren denegación por rol, roles desconocidos, auto-bloqueo y protección del último administrador.
8. Añadir consultas externas optativas BCV/SAREN con fuente, fecha, caché y consentimiento, sin bloquear operaciones offline.
9. Revisar jurídicamente cada tasa, ordenanza y regla del estimador.
10. Pruebas manuales Windows: instalación limpia, actualización conservando DB, modo avión, cierre inesperado, backup/restore y desinstalación conservando datos.

## Dictamen

**Candidato de escritorio compilable; todavía no apto para producción profesional.** La base de escritorio, autenticación local, expedientes, respaldos, importación legada, administración de usuarios/roles y almacenamiento de adjuntos están implementados en código. Falta confirmar CI de los últimos cambios y ejecutar pruebas funcionales reales en Windows. No fusionar ni publicar todavía.
