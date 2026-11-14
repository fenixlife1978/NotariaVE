# Migrar los datos del NotariaVE anterior a SQLite local

Esta guía permite trasladar los datos guardados por la versión web anterior al programa de escritorio. La exportación y la importación se realizan localmente; el archivo no se envía a ningún servicio externo.

## 1. Exportar desde el navegador anterior

1. Abra la versión anterior de NotariaVE en el mismo navegador y perfil donde se encuentran sus datos.
2. Abra las herramientas de desarrollador del navegador (normalmente F12) y seleccione la pestaña **Consola**.
3. Pegue y ejecute este bloque completo:

```javascript
(() => {
  const read = (key, fallback) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); }
    catch { throw new Error('No se pudo interpretar el dato local: ' + key); }
  };

  const payload = {
    format: 'notariave-legacy-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      clients: read('notariadoc_clients', []),
      lawyer: read('notariadoc_lawyer', null),
      criteria: read('notariadoc_criteria', null)
    }
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'notariave-exportacion-local.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  console.info('Exportación local preparada. Conserve el archivo JSON.');
})();
```

El archivo contiene únicamente clientes, perfil profesional y criterios SAREN. No exporta la sesión ni las credenciales antiguas: en escritorio se crea un administrador local nuevo.

## 2. Importar en NotariaVE de escritorio

1. Abra NotariaVE e inicie sesión con el administrador local.
2. Entre en **Criterios Notariales SAREN / Configuración**.
3. En **Migrar datos del NotariaVE anterior**, seleccione el archivo JSON descargado.
4. Revise la cantidad de clientes, perfil y criterios detectados.
5. Confirme la importación solo después de revisar el resumen.

## 3. Qué hace la importación

- Inserta clientes que no estén duplicados por identificador, cédula o RIF.
- No sobrescribe clientes locales existentes.
- Importa el perfil profesional y los criterios SAREN del archivo si existen; estos dos ajustes sí sustituyen los valores locales actuales después de la confirmación.
- Omite los registros de demostración conocidos que venían precargados en la versión anterior.
- No importa la sesión ni contraseñas anteriores.
- No elimina registros de la base SQLite.
- Ejecuta la importación en una transacción y registra el resumen en la bitácora local.

## 4. Verificación y conservación

Después de importar, revise el directorio de clientes, el perfil profesional y los criterios SAREN. Cree un respaldo SQLite verificado y conserve tanto el archivo `.sqlite` como su `.manifest.json`.

**No borre los datos del navegador anterior ni el archivo JSON hasta comprobar que la información necesaria aparece correctamente en NotariaVE de escritorio y que el respaldo se puede verificar.**
