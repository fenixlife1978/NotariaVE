# NotariaVE

**Aplicación de escritorio para gestión notarial y registral.** La arquitectura objetivo usa SQLite local como única fuente de verdad y permite operar sin conexión a Internet.

## Estado

La migración de escritorio está en curso en la rama `desktop-sqlite-migration`. No se debe usar todavía para trabajo profesional con datos reales ni fusionar a `main`. Consulta [el estado detallado de migración](docs/ESTADO-MIGRACION-ESCRITORIO.md) y la [auditoría base](docs/AUDITORIA-BASE-MIGRACION.md).

## Requisitos de desarrollo

- Node.js 24 o compatible con la versión Electron fijada.
- npm.
- Windows x64 para generar el primer instalador.

## Comandos

```bash
npm install
npm run desktop:dev
npm test
npm run lint
npm run build
npm run desktop:build
```

El instalador Windows NSIS se genera en `release/`.

## Datos locales

La aplicación crea su base en el directorio de datos de usuario administrado por Electron, dentro de `data/notariave.sqlite`. No se guarda dentro de la carpeta de instalación. La primera ejecución solicita crear un administrador local; las contraseñas se verifican con hashes scrypt y las sesiones no se guardan en el navegador.

## Principios

- SQLite local, sin autenticación ni base de datos en la nube.
- No hay sincronización remota.
- La conectividad futura será opcional y solo para consultas puntuales autorizadas.
- Los datos personales de clientes y documentos no se envían a IA externa.
- Los cálculos arancelarios actuales son estimaciones no oficiales pendientes de verificación normativa.

## Seguridad y recuperación

El esquema SQLite inicial aplica WAL, claves foráneas y comprobación de integridad. La persistencia SQLite de expedientes ya está integrada en el editor, con búsqueda, reapertura y revisiones. La validación funcional completa, backups/restauración, migración de datos existentes y gestión de usuarios adicionales siguen pendientes. No introducir datos reales hasta completar esas fases y ejecutar las pruebas de aceptación.
