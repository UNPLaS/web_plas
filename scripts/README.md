# Harvest → `src/data/` (sin SQL, sin canónico aparte)

Los harvest leen y escriben directamente los JSON del sitio. Nunca modifican ni borran filas existentes: solo agregan las nuevas.

- `publications.json`: publicaciones (ORCID → Crossref).
- `theses.json`: tesis (repositorio UNAL), con `abstract`, `advisor_ids` y `student_ids`.
- `students.json`: datos de la persona; estado, tesis y año de salida se calculan en `content.ts` desde `theses.json`.
- `wip.json` (a mano, sin harvest): trabajo en curso de estudiantes activos. Ver abajo.
- `faculty.json`: ORCID (perfil "ORCID"), `aliases` de director en el repositorio y `line_ids` (el primero es la línea principal).
- `lines.json`: nombres de línea (única fuente) y `keywords` para asignar líneas a tesis.

## Comandos

```bash
# Publicaciones ORCID → Crossref → src/data/publications.json
npm run harvest:publications
npm run harvest:publications -- --dry-run
npm run harvest:publications -- --only ferestrepoca

# Tesis repositorio UNAL → src/data/{theses,students}.json
npm run harvest:theses
npm run harvest:theses -- --dry-run
npm run harvest:theses -- --test-holdout unal/89978   # solo en memoria, nunca escribe
npm run harvest:theses -- --backfill-abstracts         # completa abstracts faltantes de tesis existentes

# Pruebas (sin red)
npm test
```

## Ocultar un registro

Cambiar su `plas_catalog_source` a `"rejected"` (publicaciones y tesis): no se renderiza y el harvest no lo vuelve a traer.

## Estudiantes activos y `wip.json`

Un estudiante aparece como activo en `/people` si tiene `status: "Activo"` en `students.json` y ninguna tesis en `theses.json`. Cuando el harvest trae su tesis, pasa solo al histórico y su entrada en `wip.json` deja de mostrarse (se puede borrar después).

```json
{
  "id": "wip:apellido-tema-corto",
  "title": "Título del trabajo",
  "summary": "Descripción corta para la web. Un salto de línea separa párrafos.",
  "url": "https://… o /ruta/interna",
  "student_ids": ["estudiante:apellido-nombre"],
  "advisor_ids": ["docente:usuario"],
  "line_ids": ["line:educacion"],
  "topic_ids": ["topic:agentes-conversacionales"]
}
```

`url`, `advisor_ids`, `line_ids` y `topic_ids` son opcionales. Si hay `line_ids`, reemplazan a los del estudiante. `npm test` falla si algún id no existe en su archivo.

## Reglas de publicaciones

1. Una fila existente se detecta por `id`, DOI o título normalizado.
2. Las obras nuevas entran visibles con `plas_catalog_source: "orcid_harvest"`.
3. Se omiten las obras cuya única semilla es Fabio González sin otro docente PLaS (por ORCID o nombre) ni estudiante del grupo como coautor.

## Reglas de tesis

1. Una tesis existente se detecta por `handle`.
2. Solo posgrados de ingeniería con al menos un director PLaS; se omiten las dirigidas solo por Fabio González.
3. La línea se asigna por director, área y `keywords`; si nada decide, la primera línea del director.
4. El autor se asocia al estudiante cuyo `id` sale del nombre en el repositorio (`estudiante:apellido-nombre`); si no existe, se crea con datos mínimos para completar a mano.
5. El `abstract` se guarda en español y, si no hay, en inglés. `--backfill-abstracts` es la única operación que modifica tesis existentes, y solo agrega ese campo.
