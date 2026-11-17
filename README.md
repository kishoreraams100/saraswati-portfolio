# Saraswati Rathod — Principal Interior Designer

Static GitHub Pages site for the interior design portfolio.

**Live path:** `/saraswati-portfolio/`  
**Fonts:** Cormorant Garamond + Jost (Google Fonts; internet required)

## Edit

| What | Where |
| --- | --- |
| Copy, headings, contact | `index.html` |
| Project lists, drawings, photos | `js/data.js` |
| Layout, colour, type | `css/styles.css` |
| Nav, wipe, galleries, lightbox | `js/main.js` |
| Portrait | `images/about/portrait.png` (from `images/about/raw-002-007.jpg`) |

## Local preview (GitHub Pages base path)

From the parent folder:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/saraswati-portfolio/`.

## Deploy

Replace the files on the `main` branch of `kishoreraams100/saraswati-portfolio`. GitHub Pages should serve the root of the repo.
