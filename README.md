# PLaS — Programming Languages and Systems

Sitio web oficial del grupo de investigación **PLaS**  
Universidad Nacional de Colombia · Sede Bogotá · Facultad de Ingeniería

| | |
|---|---|
| **Clasificación Minciencias** | A1 (convocatoria 957/2024; resultados 5 dic. 2025) |
| **Correo** | plas_fibog@unal.edu.co |
| **Teléfono** | +57 1 3165000 ext. 14077 |
| **Sede** | Edificio Aulas de Ingeniería 453, Bogotá D.C. |
| **GrupLAC** | [Perfil del grupo](https://scienti.minciencias.gov.co/gruplac/jsp/visualiza/visualizagr.jsp?nro=00000000018409) |
| **HERMES** | [Consulta del grupo](http://www.hermes.unal.edu.co/pages/Consultas/Grupo.jsf?idGrupo=2343) |
| **Sitio (GitHub Pages)** | https://vethariel.github.io/Front_plas/ |

Investigamos cómo se enseñan, construyen y confían los lenguajes y los sistemas —en el aula, el laboratorio y problemas reales de movilidad y producción. Formamos en maestría y doctorado y preferimos dejar métodos y herramientas reutilizables, no solo papers.

## Líneas de investigación

1. Lenguajes de programación  
2. Educación en ingeniería  
3. Sistemas embebidos confiables  
4. Sistemas inteligentes de transporte  
5. Agricultura de precisión  

## Contenido del sitio

| Ruta | Contenido |
|------|-----------|
| `/` | Inicio (hero, novedades, proyectos, equipo, líneas) |
| `/about` | Sobre el grupo |
| `/lines` | Líneas de investigación |
| `/projects`, `/projects/[id]` | Proyectos y detalle (markdown) |
| `/blog`, `/blog/[id]` | Novedades |
| `/catalog` | Publicaciones y tesis (filtros) |
| `/resources` | Recursos descargables |
| `/people` | Docentes y trayectoria de estudiantes |
| `/contact` | Contacto |

Datos públicos aproximados (export actual): 5 líneas, 13 proyectos, 4 docentes, 55 estudiantes, 94 publicaciones de catálogo, 54 tesis, 15 recursos.

## Stack

- **Astro 7** (sitio estático) + **Tailwind 4**
- Chrome visual UNAL + identidad PLaS
- Node **≥ 22.12**
- Datos en JSON (`src/data/`); cosecha canónica en `data/harvest/`

## Desarrollo

```bash
npm install
npm run dev          # servidor local
npm run build        # salida en dist/
npm run preview      # previsualizar el build
npm test             # pruebas (mesh + harvest)
```

En este repo, el modo background de Astro es:

```bash
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

## Datos y harvest

El canónico vive en `data/harvest/*.json`. Tras cosechar o editar catálogo (`plas_catalog`), se proyecta a `src/data/`:

```bash
npm run harvest:publications   # ORCID → Crossref → harvest + sitio
npm run harvest:theses         # Repositorio UNAL → harvest + sitio
npm run harvest:project        # Solo proyectar harvest → src/data
```

Detalle: [`scripts/README.md`](scripts/README.md).

Publicaciones nuevas entran como `plas_catalog=pending` hasta confirmarlas como producto del grupo (`yes`) y volver a proyectar.

## Despliegue (GitHub Pages)

URL: https://vethariel.github.io/Front_plas/

1. En el repo: **Settings → Pages → Source = GitHub Actions**
2. Push a `main`, o **Actions → Deploy to GitHub Pages → Run workflow**

Configuración:

- Workflow: `.github/workflows/deploy.yml`
- `astro.config.mjs`: `site` + `base: '/Front_plas'`
- Rutas y assets usan el helper `withBase` para el subpath de Pages

## Licencia y créditos

Contenido académico e institucional del grupo PLaS / Universidad Nacional de Colombia.  
Plantilla de chrome alineada a lineamientos de identidad UNAL.
