# NotariaVE — arquitectura objetivo de escritorio

## Decisión de producto
NotariaVE será una aplicación de escritorio instalable. La operación profesional no dependerá de navegador, hosting, servicios de autenticación, bases de datos remotas ni APIs cloud. SQLite en el equipo será la única fuente de verdad.

## Principios no negociables
1. **SQLite local como única base de datos operativa.** Un archivo por instalación, en el directorio de datos del sistema y fuera de la carpeta de instalación.
2. **Autenticación local.** Usuarios, hashes, roles, permisos y estado de cuenta se verifican localmente. No se aceptan credenciales de demostración ni login por campos no vacíos.
3. **Offline-first real.** Clientes, perfil profesional, configuración, documentos, expedientes, cálculos guardados, auditoría y adjuntos funcionan sin Internet.
4. **Internet optativo y acotado.** Solo consultas explícitas de información cambiante (BCV, fuentes normativas/SAREN). Una consulta fallida nunca bloquea el trabajo local. Registrar fuente, fecha/hora y resultado.
5. **Sin sincronización cloud.** No Firebase, Supabase, Turso, autenticación hosted, API alojada ni persistencia remota.
6. **Privacidad por defecto.** No sembrar datos personales ficticios como clientes iniciales. El primer inicio configura el administrador y crea una base vacía.
7. **Integridad y recuperación.** Migraciones versionadas y transaccionales; claves foráneas; restricciones; auditoría; backups locales consistentes; restauración validada; nunca eliminar datos al actualizar.
8. **Documentos y adjuntos.** Binarios en directorio local controlado; SQLite conserva metadatos, relaciones y hash SHA-256.
9. **Seguridad del shell.** Renderer sin Node ni acceso directo a filesystem/SQLite; operaciones mediante IPC tipado y de privilegio mínimo; context isolation y sandbox habilitados.
10. **IA no esencial.** Ninguna función principal requiere Gemini u otra IA remota. Una futura IA externa será opt-in y mostrará qué contenido saldrá del equipo.

## Arquitectura técnica a validar
- Shell: Electron, por compatibilidad con React/Vite.
- UI: React/Vite reutilizando componentes existentes.
- Persistencia: SQLite con driver nativo compatible con Electron; transacciones, WAL y foreign keys.
- Dominio/repositorios: SQLite exclusivamente desde proceso principal.
- IPC: canales explícitos para autenticación, clientes, perfil, configuración, documentos, consultas y backups.
- Primer destino de distribución: Windows. macOS/Linux quedan separados para una fase posterior.

La elección de Electron y del driver queda sujeta a validar ABI nativa, empaquetado y pruebas en el sistema destino.

## Estado inicial observado (auditoría estática)
- React 19 + Vite 8 y servidor Express en `server.ts`.
- `src/App.tsx` lee/escribe usuario, clientes, perfil y criterios mediante `localStorage`.
- `src/components/LoginPage.tsx` acepta cualquier usuario y contraseña no vacíos, contiene acceso demo y crea una sesión frontend sin validar identidad.
- `server.ts` expone rutas Gemini para redacción y revisión documental; el runtime de escritorio no debe depender de Express/API remota.
- `src/data/initialData.ts` contiene datos personales de ejemplo y tasa BCV fija (68.5); no deben sembrarse como clientes reales.
- `index.html` carga Google Fonts desde Internet; las fuentes deben empaquetarse localmente o sustituirse por fuentes del sistema.
- El script `start` ejecuta `node server.ts`; no existe todavía un ejecutable de escritorio configurado.

## Secuencia de migración segura

### Fase 0 — inventario y línea base
- Enumerar archivos, rutas API, llamadas fetch, uso de localStorage/sessionStorage/IndexedDB, recursos externos, exportaciones y cálculos.
- Identificar modelos y relaciones antes de diseñar tablas.
- Ejecutar y registrar build/lint/pruebas; documentar límites sin modificar datos.

### Fase 1 — shell y persistencia
- Incorporar Electron y empaquetado sin romper el build actual durante la transición.
- Crear directorio local de datos y apertura segura de SQLite.
- Migraciones versionadas, WAL, foreign keys, busy timeout e integridad.
- Primer administrador mediante asistente de inicio; hash moderno versionado; recuperación local documentada.
- No guardar contraseñas ni sesiones persistentes en texto plano.

### Fase 2 — migración funcional
- Sustituir localStorage como autoridad por repositorios SQLite vía IPC.
- Implementar usuarios/roles, clientes, perfil, parámetros SAREN, expedientes y documentos con transacciones y auditoría.
- Importador de datos existentes con previsualización, copia previa y deduplicación; excluir ejemplos ficticios.
- Eliminar la persistencia de sesión en localStorage.

### Fase 3 — independencia de red
- Sustituir Google Fonts por recursos locales.
- Separar consultas online opcionales de operaciones internas.
- Eliminar Express como servidor requerido.
- Revisar telemetría, analytics, actualizaciones y solicitudes de red para que no transmitan información privada ni sean necesarias para operar.

### Fase 4 — calidad, seguridad y distribución
- Pruebas de autenticación, permisos, aislamiento, transacciones, cierres inesperados, backup/restore, migraciones y modo avión.
- Verificar ausencia de conexiones remotas de base de datos/autenticación.
- Probar instalación limpia, actualización con datos y desinstalación sin borrar la base del usuario.

## Criterios de aceptación
- Instala y abre sin Internet.
- Login decidido exclusivamente con SQLite local.
- Datos persisten tras reiniciar.
- Ante DB inaccesible/corrupta, falla de forma segura; nunca usa backend remoto.
- Fallos de consultas externas no bloquean el trabajo.
- Backup y restore verifican integridad y relaciones.
- Una migración fallida se revierte y conserva datos.
- Ningún dato personal sale del equipo sin acción explícita e informada.
