# ZonexDev — Full Multi-Page Website

This build keeps the complete 26-page information architecture with clean production URL routes and client-side routing enhancement while preserving the ZonexDev visual language and motion system.

## Clean URL Routes

All internal links and navigation use production-ready, human-readable clean routes:

- `/` → Home
- `/company` → Company
- `/about` → About
- `/services` → All Capabilities
- `/services/web-design` → Web Design
- `/services/branding` → Branding
- `/services/ux-ui` → UX/UI Design
- `/services/motion` → Motion Design
- `/services/seo` → SEO
- `/services/content` → Content Creation
- `/services/landing-page` → Landing Pages
- `/services/development` → Creative Development
- `/projects` → Selected Work
- `/projects/nova` → Featured Case Study
- `/startups` → For Startups
- `/team` → Creative Team
- `/careers` → Careers
- `/testimonials` → Testimonials
- `/industries` → Industries (with `#ai`, `#fintech`, etc.)
- `/resources` → Resources Hub
- `/resources/ux-audit` → UX Audit Checklist
- `/blog` → Insights / Articles
- `/blog/redesign` → Redesign Framework Article
- `/lab` → Creative Lab
- `/contact` → Contact
- `/privacy` → Privacy Policy

## Run Locally

### Option 1: Node.js (Recommended)

Run the included zero-dependency clean routing server:

```bash
npm run dev
# or
node server.js
```

Then visit [http://localhost:3000/](http://localhost:3000/).

### Option 2: Python 3

```bash
python3 server.py
```

Then visit [http://localhost:3000/](http://localhost:3000/).

## Features & Routing Architecture

- **Clean URL Structure**: Every section has its own human-readable route without `.html` extensions.
- **Client-Side SPA Routing**: Instant, smooth page transitions powered by HTML5 History API (`pushState`, `popState`).
- **Direct Navigation & Refresh**: Fully supports browser refreshes, bookmarks, direct URL entry, and browser Back/Forward navigation without 404s.
- **Native Fallback**: If JavaScript is disabled or network fails, links fall back to standard multi-page static routing.
- **Deployment Ready**: Includes configuration files for Vercel (`vercel.json`), Netlify / Cloudflare Pages (`_redirects`, `_headers`), and Apache (`.htaccess`).

## Visual Direction & Motion

- Deep black / navy hero environments
- Animated electric-blue and violet aurora fields
- Large editorial typography with controlled responsive sizing
- Rounded white content surfaces that overlap page heroes cleanly
- Lightweight orbital hero artwork on inner pages
- Glass / pill navigation and responsive futuristic mega menu
- GSAP + ScrollTrigger enhancement layer with progressive enhancement fallbacks
