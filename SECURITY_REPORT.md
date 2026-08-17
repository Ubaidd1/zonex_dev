# ZonexDev Static Security / Integrity Report

Smoothness + structure pass: 2026-08-15

## Static integrity checks

- 25 production HTML pages checked
- Only `index.html` remains at the project root; all other pages use folder routes
- 0 missing local links/assets
- 0 duplicate element IDs
- 0 images missing `alt` attributes
- 0 inner-page `hero-signal` / live-signal image sculptures remain
- 0 desktop mega-menu chevron indicators remain
- Every inner `.page-hero` contains the lightweight orbital visual
- Every page contains a preloader with a timed fail-safe
- JavaScript syntax: PASS (`node --check`)
- CSS parser errors: 0

## Performance-oriented changes

- Removed the continuous cursor requestAnimationFrame loop; pointer rendering is now event-driven and frame-batched
- Starfield is capped to a lower device-pixel ratio, fewer particles and approximately 30fps
- Removed JavaScript 3D card-tilt tracking
- Reduced generic ScrollTrigger work; only the startup process graph and featured-case parallax use scrubbed scroll animation
- Inner-page hero entrance runs during the preloader transition rather than hiding already-painted text
- Large aurora effects use transform-only drift instead of animated blurred background-position layers
- Mobile disables expensive backdrop blur on the main interactive surfaces
- Page hero artwork no longer contains moving image cards, beams or blinking nodes

## Client-side security checks

The custom JavaScript contains none of the following patterns:

- `eval()`
- `new Function`
- `document.write`
- dynamic `innerHTML` / `outerHTML` assignment
- `insertAdjacentHTML`
- `localStorage` / `sessionStorage`
- `XMLHttpRequest`
- WebSockets

The contact forms remain privacy-first prototypes. Submitting them does **not** transmit or store user data.

## Browser security controls

The project includes a Content Security Policy plus deployment header guidance for clickjacking protection, MIME sniffing protection, restrictive browser permissions and referrer control.

`img-src` currently allows `https://cdn.prod.website-files.com` because the build uses temporary full-resolution reference imagery requested for this design phase. Remove that origin after replacing the placeholders with owned/local ZonexDev imagery.

## Remaining third-party runtime dependencies

GSAP 3.15.0 and ScrollTrigger are version-pinned to jsDelivr. The custom site script is loaded first so the preloader, navigation and core interactions do not depend on GSAP being available. For maximum supply-chain resilience, self-host reviewed GSAP files before a production launch and then remove the CDN origin from `script-src`.

## Important limitation

Static checks reduce obvious client-side problems but cannot guarantee that a future production deployment will never be compromised or unavailable. Hosting configuration, DNS, accounts, backend/form infrastructure, dependencies and operational security also require ongoing maintenance.
