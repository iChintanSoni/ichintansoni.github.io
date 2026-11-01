# ichintansoni.github.io

Personal portfolio of **Chintan Soni**, AI engineer and engineering leader. Live at [ichintansoni.github.io](https://ichintansoni.github.io).

## Stack

Plain HTML, CSS and JavaScript with no build step. Animations use [GSAP 3.13](https://gsap.com) (ScrollTrigger, SplitText) and [Lenis](https://lenis.darkroom.engineering) smooth scroll, both loaded from CDN. Fonts come from Google Fonts.

```
index.html        page structure and all content
css/style.css     design tokens, layout, components, responsive rules
js/main.js        preloader, smooth scroll, hero canvas, cursor, scroll animations
assets/           headshot, Open Graph image, favicon, resume PDF
```

## Run locally

```sh
npm start          # or: python3 -m http.server 4001 --bind 127.0.0.1
open http://127.0.0.1:4001
```

## Editing content

Everything visible lives in `index.html`. Sections are marked with `<!-- ===== NAME ===== -->` comments. To update:

- **Experience, skills, credentials**: edit the matching section markup.
- **Projects / writing**: each card or post is a self-contained `<article>` or `<li>`.
- **Metrics**: change `data-count` on the `.count` spans; the counter animates to that value.
- **Resume**: replace `assets/Chintan_Soni_Resume.pdf`.
- **Headshot**: replace `assets/images/chintan.jpg` and `chintan.webp` (4:5 portrait works best).

The intro preloader plays once per browser tab session. Open a new tab to see it again. All motion respects `prefers-reduced-motion`.
