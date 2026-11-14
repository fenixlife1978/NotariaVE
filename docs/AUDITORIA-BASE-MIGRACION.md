# NotariaVE — auditoría base para migración de escritorio

Fecha: 2026-11-14
Rama de trabajo: desktop-sqlite-migration
Alcance: revisión estática de archivos fuente consultados en GitHub. No se ejecutó la aplicación, build, lint ni suite de pruebas. No se inspeccionó una base de datos de usuario ni un equipo instalado.

## Hallazgos confirmados

| ID | Severidad | Archivo | Hallazgo | Consecuencia |
|---|---|---|---|---|
| NV-001 | Crítica | src/components/LoginPage.tsx | El submit acepta cualquier usuario/clave no vacíos y llama onLogin sin validar credenciales. | No existe autenticación real; cualquier persona puede entrar. |
| NV-002 | Crítica | src/App.tsx | La sesión se restaura y guarda en localStorage como JSON modificable desde el renderer. | No hay control de identidad ni sesión confiable. |
| NV-003 | Alta | src/App.tsx | Clientes, perfil del abogado y criterios SAREN dependen de localStorage. | No existe base transaccional ni integridad referencial; pérdida/corrupción de almacenamiento afecta datos. |
| NV-004 | Alta | src/data/initialData.ts | Se inicializan clientes con identidades, cédulas, RIF, direcciones, teléfonos y correos de ejemplo. | Riesgo de confundir datos ficticios con datos reales; no deben sembrarse en una instalación profesional. |
| NV-005 | Crítica | src/components/DocumentEditor.tsx | El formulario inicia con datos completos de ejemplo de vehículo, inmueble, sociedad, poder, arrendamiento y viaje de menor. | Riesgo de generar instrumentos con información ficticia si no se reemplaza cada campo. |
| NV-006 | Alta | server.ts | Las rutas Gemini reciben contenido documental y datos de partes por HTTP; no se observa autenticación/autorización en las rutas revisadas. | Riesgo de exposición de datos sensibles y dependencia de servicio remoto. |
| NV-007 | Alta | server.ts | Express escucha en 0.0.0.0 y se usa como runtime principal. | Superficie de red innecesaria para una aplicación de escritorio autónoma. |
| NV-008 | Alta | index.html | Se cargan fuentes de Google Fonts mediante recursos externos. | La interfaz depende de Internet para ese recurso y hace solicitudes de red. |
| NV-009 | Alta | src/data/initialData.ts / src/components/FeeCalculatorView.tsx | Existe una tasa BCV inicial fija (68.5) y la calculadora usa ese valor como respaldo. | La estimación puede mostrarse como actual aunque no esté actualizada. |
| NV-010 | Alta | src/utils/feeCalculator.ts | La calculadora contiene porcentajes, mínimos y montos fijos codificados; ejemplos visibles incluyen 1.5%, 1.2%, 45 Bs por plana, tasas municipales equivalentes a USD y recargo exprés 50%. | Los importes no deben presentarse como tarifas oficiales vigentes sin fuente, vigencia, jurisdicción y validación legal. |
| NV-011 | Media | package.json / vite.config.ts | El proyecto define scripts Vite/Express y no declara shell Electron ni empaquetado de escritorio. | Aún no es un software de escritorio instalable. |
| NV-012 | Media | src/utils/docxExporter.ts | La exportación Word se realiza en el navegador con file-saver. | Debe revisarse para guardado controlado local, nombres, rutas y tratamiento de errores en escritorio. |

## Riesgos y decisiones de diseño

- No migrar los registros de demostración como clientes o expedientes. La importación de datos locales debe ser explícita, revisable y precedida por backup.
- El estado inicial del editor debe ser un formulario vacío/plantilla sin datos personales o números de identificación ficticios.
- El motor de aranceles necesita separar reglas legales verificadas de estimaciones configurables. Cada regla deberá indicar fuente, artículo/ordenanza, jurisdicción, vigencia desde/hasta y fecha de revisión. Hasta entonces, rotular como estimación orientativa.
- Las rutas Gemini no deben permanecer como dependencia del runtime. La IA externa, si se conserva, requiere consentimiento por operación, advertencia de transferencia de datos y minimización del contenido enviado.
- La base SQLite debe incluir al menos usuarios, perfiles, clientes, documentos/expedientes, parámetros, reglas y fuentes tarifarias, adjuntos, auditoría y migraciones. El esquema final se definirá después de completar el inventario de modelos y relaciones.
- La migración de localStorage debe ejecutarse en el equipo del usuario, no en GitHub ni en un servidor; exportar primero los datos existentes, presentar resumen y permitir importación confirmada.

## Trabajo todavía pendiente para cerrar la auditoría

1. Inventariar el repositorio completo, dependencias, workflows, recursos remotos y todas las llamadas de red/almacenamiento.
2. Ejecutar baseline real de build, TypeScript/lint y pruebas en un entorno reproducible.
3. Definir y revisar el esquema SQLite con migraciones y restricciones.
4. Implementar Electron + IPC seguro + autenticación local.
5. Migrar cada módulo a repositorios SQLite; retirar localStorage como fuente de verdad.
6. Implementar backup/restore, adjuntos locales y auditoría.
7. Validar instalación offline, permisos, migración sin pérdida y ausencia de tráfico remoto no autorizado.

## Dictamen

**No apto todavía para uso profesional con datos reales.** La autenticación actual es inexistente, la persistencia no es SQLite, hay datos de demostración precargados y la calculadora no acredita la vigencia de sus reglas. Esta conclusión es estática y provisional; no equivale a una prueba dinámica ni a certificación jurídica.
