# Harvest → JSON (sin SQL)

Canónico: `data/harvest/*.json`  
Sitio: `src/data/{publications,theses,students}.json` (proyección)

## Comandos

```bash
# Regenerar canónico desde SQLite de new_plas (opcional / bootstrap)
npm run harvest:bootstrap -- /ruta/a/plas.sqlite

# Publicaciones ORCID → Crossref → JSON + proyecta catálogo
npm run harvest:publications
npm run harvest:publications -- --dry-run
npm run harvest:publications -- --only ferestrepoca

# Tesis RI UNAL → JSON + proyecta
npm run harvest:theses
npm run harvest:theses -- --dry-run
npm run harvest:theses -- --test-holdout unal/89978

# Solo proyectar canónico → src/data
npm run harvest:project

# Pruebas (sin red)
npm test
```

Flags comunes: `--skip-project` (no toca `src/data`), `--dry-run`.

## Flujo

1. Los harvest leen/escriben tablas en `data/harvest/` (mismo modelo que las tablas SQL de new_plas).
2. `project-site` filtra `plas_catalog=yes` / `visible=yes` y arma el JSON del sitio.
3. Publicaciones nuevas quedan en `plas_catalog=pending` hasta revisión manual en el canónico.
