# ZonexDev — Full Multi-Page Website

This build keeps the complete 25-page information architecture while using the original ZonexDev visual language as the design source of truth.

## Visual direction

- Deep black / navy hero environments
- Animated electric-blue and violet aurora fields
- Large editorial typography with controlled responsive sizing
- Rounded white content surfaces that overlap page heroes cleanly
- Lightweight orbital hero artwork on inner pages, matching the homepage visual language
- Glass / pill navigation and a responsive futuristic mega menu
- Full-resolution reference-site placeholder imagery for portfolio and visual-direction sections
- Stronger mobile gutters and consistent content alignment

The reference website is used for content/coverage only. The visual styling follows the earlier ZonexDev concept.

## Pages

The package contains 25 HTML pages including Home, About, Team, Careers, Services, eight service detail pages, Projects, a case study, Startups, Industries, Resources, a resource detail page, Lab, Blog, an article page, Testimonials, Contact and Privacy.

## Motion

GSAP + ScrollTrigger enhance the motion layer when available, with progressive-enhancement fallbacks so content remains visible if GSAP fails or reduced motion is requested.

Motion includes:

- Home hero word reveals
- Inner-page hero entrance sequences
- Animated aurora / gradient fields
- Scroll-triggered section reveals
- Startup process graph drawing
- Parallax imagery
- Magnetic buttons
- Mega-menu transitions
- Interactive homepage service tabs
- Project filtering
- Animated counters
- FAQ accordion motion
- Starfield canvas

## Startups page

The Startups page now includes:

- A fully aligned four-card inflection-point grid
- A labeled and expanded startup capability section
- A four-stage animated process graph
- A visual design-direction gallery using the supplied Dribbble reference imagery
- Additional signal/proof and related-content sections

## Run locally

Serve the directory through a local HTTP server. Example:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/`.

## Logo

`assets/logo/` is intentionally ready for the final ZonexDev logo.

## Contact form

The prototype validates locally but does not transmit or store submitted data. Connect a reviewed server-side endpoint before production launch.

## Production note

GSAP 3.15.0 and ScrollTrigger are currently loaded from version-pinned jsDelivr URLs. For a fully self-contained deployment, vendor reviewed copies into your own asset pipeline and remove the CDN origin from the CSP.

## Folder structure

Only the main `index.html` lives at the project root. Every other HTML page now uses a folder route with its own `index.html`, for example `about/index.html`, `projects/index.html`, `projects/nova/index.html`, and `services/web-design/index.html`. This keeps deployment URLs clean while preserving a static-site workflow.

## Temporary full-resolution image placeholders

The portfolio / lab / visual-direction images currently use high-resolution AVIF/PNG URLs already present in the supplied reference-site source. They are intentionally easy to replace later. Current placeholder sources include:

- `https://cdn.prod.website-files.com/673a535e55337a9ba48cdebb/69f5bae65b4da835b12cfc56_69f5ba2d0535627b2bfc7b34_Large%20Screen%20Standard%20Mockup%20(1)%203.avif`
- `https://cdn.prod.website-files.com/673a535e55337a9ba48cdebb/68f8abad98ac56ab556084f0_titanx1.avif`
- `https://cdn.prod.website-files.com/673a535e55337a9ba48cdebb/68c01da30b7aec4ebc60525c_rthb.avif`
- `https://cdn.prod.website-files.com/673a535e55337a9ba48cdebb/675b5780d323ac9ffee2877c_%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5(14).avif`

Replace these with licensed ZonexDev project imagery before a public production launch.

