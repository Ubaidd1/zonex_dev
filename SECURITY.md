# Security notes

- No analytics, advertising pixels, account system, database, cookies or client-side secrets.
- Contact data is not sent to the website; the form prepares a local mail draft only.
- Content Security Policy restricts scripts to this origin and jsDelivr (GSAP), images/fonts/media to local files/data, and blocks network connections.
- Deployment headers deny framing, MIME sniffing, sensitive browser permissions and enforce HTTPS/HSTS.
- Replace third-party CDN delivery with a pinned self-hosted GSAP build if your deployment policy requires a zero-third-party runtime.
- Any future CMS, form API, analytics, booking tool, authentication or database materially changes the threat model and needs a new review.
