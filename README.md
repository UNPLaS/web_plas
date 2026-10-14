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
| **Sitio oficial** | https://plas.unal.edu.co |
| **Espejo (GitHub Pages)** | https://unplas.github.io/web_plas/ |

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
| `/` | Inicio (hero, citas, novedades, proyectos, equipo, líneas) |
| `/about` | Sobre el grupo |
| `/lines` | Líneas de investigación |
| `/projects`, `/projects/[id]` | Proyectos y detalle (markdown) |
| `/blog`, `/blog/[id]` | Novedades |
| `/catalog` | Publicaciones y tesis (filtros) |
| `/resources` | Recursos descargables |
| `/people` | Docentes y trayectoria de estudiantes |
| `/contact` | Contacto |
| `/en/…` | Las mismas páginas en inglés |

Datos públicos aproximados (export actual): 5 líneas, 13 proyectos, 4 docentes, 55 estudiantes, 94 publicaciones de catálogo, 54 tesis, 15 recursos.

## Stack

- **Astro 7** (sitio estático) + **Tailwind 4**
- Chrome visual UNAL + identidad PLaS
- Node **≥ 22.12**
- Datos en JSON (`src/data/`), alimentados por los harvest de ORCID y del repositorio UNAL

## Desarrollo

```bash
npm install
npm run dev          # servidor local
npm run build        # UNAL: site plas.unal.edu.co, base /
npm run build:unal   # explícito UNAL
npm run build:pages  # GitHub Pages: base /web_plas
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

Todos los datos viven en `src/data/`. Los harvest agregan registros nuevos directamente ahí, sin tocar los existentes:

```bash
npm run harvest:publications   # ORCID → Crossref → src/data/publications.json
npm run harvest:theses         # Repositorio UNAL → src/data/{theses,students}.json
```

Detalle: [`scripts/README.md`](scripts/README.md).

**Cosecha automática:** `.github/workflows/harvest.yml` corre ambos harvest cada lunes (6:00 a. m. en Colombia) sobre `main`. Si hay registros nuevos y `npm test`, `npm run check` y el build pasan, hace commit directo a `main` (`data: cosecha semanal …`, con la lista de lo agregado) y lanza los despliegues de GitHub Pages y UNAL. Si no hay novedades no hace nada; si una fuente falla, publica lo de la otra y el run queda en rojo. Se puede lanzar a mano en **Actions → Harvest → Run workflow**.

Como esos commits llegan a `main` sin pasar por `dev`, conviene traer `main` a `dev` antes de trabajar (`git pull origin main` estando en `dev`). Los estudiantes nuevos que trae la cosecha de tesis aparecen en el resumen del commit para completar sus datos a mano.

## Idiomas (español / inglés)

Cada página existe en español en la raíz (`/lines`) y en inglés bajo `/en` (`/en/lines`). Las páginas viven en `src/pages/[...lang]/`; solo `404.astro` y `robots.txt.ts` quedan fuera.

- **Textos de la interfaz:** `src/i18n/es.ts` y `src/i18n/en.ts`. `en.ts` está tipado contra `es.ts`, así que una clave faltante es un error de `npm run check`.
- **Contenido:** los JSON de `src/data/` son la fuente en español; `src/data/en/*.json` guarda solo los campos traducidos, por `id` del registro (`lines`, `faculty`, `projects`, `blog`) o por línea y nodo (`line-topic-graphs`). Lo que no esté traducido se muestra en español y se marca con `lang="es"`. Títulos y resúmenes de publicaciones y tesis se quedan en su idioma original.
- **Enlaces en el markdown** de proyectos y blog: escribir rutas sin idioma (`/contact`, `/lines/educacion`); en las páginas en inglés se convierten solas a `/en/…`.
- **Ejemplo:** para traducir un proyecto, agregar a `src/data/en/projects.json` `{ "<id del proyecto>": { "title_short": "…", "summary": "…", "content": "…" } }`.
- **Primera visita:** si el navegador no prefiere español, se redirige a `/en/…` (los bots no). El selector ES/EN del encabezado guarda la elección y desactiva la redirección.

## Imágenes

Las imágenes viven en `public/images/` y se sirven tal cual, así que conviene optimizarlas al agregarlas. Tras copiar una foto nueva (JPG o PNG) y referenciarla en los JSON:

```bash
npm run images:optimize -- --dry   # muestra qué convertiría
npm run images:optimize            # pasa a WebP, redimensiona y actualiza las rutas en src/
```

Retratos quedan en máx. 640 px, logos de fuentes en 480 px y el resto en 1600 px. Si el WebP no ahorra al menos un 10 %, el original se deja como está. `public/images/og/` se excluye: la vista previa en redes (`og/plas.jpg`, 1200×630) debe ser JPG.

Publicaciones nuevas entran visibles, salvo las de Fabio González sin coautor PLaS. Para ocultar una publicación o tesis, cambiar su `plas_catalog_source` a `"rejected"`: no se renderiza y el harvest no la vuelve a traer.

## Despliegue

`site` y `base` se configuran con variables de entorno (`PLAS_SITE`, `PLAS_BASE`). Por defecto: **https://plas.unal.edu.co** y `base: '/'`.

### Apache (plas.unal.edu.co)

DocumentRoot del vhost → `/var/www/html/plas` (raíz del dominio, no subpath).

```bash
npm run build:unal   # o npm run build
sudo rsync -a --delete dist/ /var/www/html/plas/
```

Comprobar que CSS/JS carguen desde `/_astro/...` (no `/web_plas/_astro/...`).

En el vhost, para que las rutas inexistentes muestren la página propia del sitio y los assets con hash se cacheen:

```apache
ErrorDocument 404 /404.html
<LocationMatch "^/_astro/">
  Header set Cache-Control "public, max-age=31536000, immutable"
</LocationMatch>
```

### GitHub Pages

URL: https://unplas.github.io/web_plas/

1. En el repo: **Settings → Pages → Source = GitHub Actions**
2. Push a `main`, o **Actions → Deploy to GitHub Pages → Run workflow**

Configuración:

- Workflow: `.github/workflows/deploy.yml` (define `PLAS_SITE` / `PLAS_BASE`)
- Local: `npm run build:pages`
- Rutas y assets usan `withBase` para el subpath de Pages

## Licencia y créditos

Contenido académico e institucional del grupo PLaS / Universidad Nacional de Colombia.  
Plantilla de chrome alineada a lineamientos de identidad UNAL.
