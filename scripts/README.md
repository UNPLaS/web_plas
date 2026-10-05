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

Un estudiante aparece como activo en `/people` si tiene `status: "Activo"` en `students.json` y no tiene tesis en `theses.json` del nivel de su `role_group` o superior. Quien ya tiene tesis de maestría y cursa doctorado (`role_group: "estudiante_doctorado"`) aparece en ambos lados: en activos con su trabajo de `wip.json` y en el histórico con su tesis. Cuando el harvest trae la tesis de su nivel actual, pasa solo al histórico y su entrada en `wip.json` deja de mostrarse (se puede borrar después).

```json
{
  "id": "wip:apellido-tema-corto",
  "title": "Título del trabajo",
  "summary": "Descripción corta para la web. Un salto de línea separa párrafos.",
  "url": "https://… o /ruta/interna",
  "student_ids": ["estudiante:apellido-nombre"],
  "advisor_ids": ["docente:usuario"],
  "codirector_ids": ["docente:otro-usuario"],
  "line_ids": ["line:educacion"],
  "topic_ids": ["topic:agentes-conversacionales"]
}
```

`id`, `title`, `student_ids` y `advisor_ids` (quien dirige) son obligatorios; `title` puede quedar vacío (`""`) mientras el trabajo no tenga título, para registrar ya la dirección. `summary`, `url`, `codirector_ids`, `line_ids` y `topic_ids`, opcionales. Si hay `line_ids`, reemplazan a los del estudiante. El `id` del estudiante debe salir de su nombre como en el repositorio (`estudiante:apellido-apellido-nombre-nombre`, sin tildes) para que el harvest lo enlace con su tesis. `npm test` falla si algún id no existe en su archivo.

## Dirección y codirección

En `theses.json` y `wip.json`, `advisor_ids` es quien dirige y `codirector_ids` quien codirige (un docente no puede estar en ambos). El repositorio no distingue roles, así que el harvest pone a todos los docentes PLaS en `advisor_ids`; para marcar una codirección, mueve el id a `codirector_ids` a mano (el harvest no vuelve a tocar tesis existentes).

## Reglas de publicaciones

1. Una fila existente se detecta por `id`, DOI o título normalizado.
2. Las obras nuevas entran visibles con `plas_catalog_source: "orcid_harvest"`.
3. Se omiten las obras cuya única semilla es Fabio González sin otro docente PLaS (por ORCID o nombre) ni estudiante del grupo como coautor.

## Reglas de tesis

1. Una tesis existente se detecta por `handle`.
2. Solo posgrados de ingeniería con al menos un director PLaS; se omiten las dirigidas solo por Fabio González.
3. La línea se asigna por director, área y `keywords`; si nada decide, la primera línea del director.
4. El autor se asocia al estudiante cuyo `id` sale del nombre en el repositorio (`estudiante:apellido-nombre`); si no existe, se crea con datos mínimos para completar a mano.
5. El `abstract` se guarda en español y, si no hay, en inglés, sin la nota "(Texto tomado de la fuente)" que agrega el repositorio. `--backfill-abstracts` es la única operación que modifica tesis existentes, y solo agrega ese campo.
