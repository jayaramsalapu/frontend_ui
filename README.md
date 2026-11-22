# EasyConnect — Quietly Human frontend concept

A five-page responsive frontend concept for a college blood-donation community project, using **plain HTML, CSS, JavaScript**, compatible with **Flask + Jinja2**.

## Pages
- `index.html` — editorial landing page with illustrated hero and a clear three-step story
- `register.html` — four-step donor registration with progressive blood-bag-to-heart/plant SVG animation
- `donors.html` — functional *demo-data* city, group, and availability filters
- `request.html` — blood request form, validation, and safety guidance
- `dashboard.html` — sample member dashboard and status cards

## Run
Open `index.html` in a browser, or for reliable module loading:

```bash
cd easyconnect_frontend
python -m http.server 8000
```

Visit http://localhost:8000.

## Flask integration
Copy `styles.css` and `app.js` into `static/`; copy the HTML files into `templates/`. Replace `.html` navigation hrefs with `{{ url_for('...') }}` matching your Flask routes. Implement backend validation, authentication, CSRF protection, privacy controls, rate limiting, consent auditing, contact relay, and appropriate manual review before production.

## Animation strategy
- Motion.dev progressively enhances hero, section, and card entrance.
- Anime.js adds a subtle heartbeat to the registration life illustration after each step.
- Native SVG/CSS draws and fills the donation bag and plant without image assets; survives CDN outages.
- `prefers-reduced-motion` is respected for library animation.
- For fully offline production builds, download/install pinned library packages locally and serve through Flask assets.

## Design system
- Palette: paper `#f5f2e9`, ink `#26332e`, olive `#66765b`, clay `#c18b74`, accent oxblood `#974f53`
- Type: Manrope headings, DM Sans interface, Georgia italic for occasional human emphasis
- Accessibility: labelled controls, visible focus states, mobile layout, role/status messages; conduct full WCAG audit before deployment.

## Important boundaries
- This is a **frontend prototype**, not a deployed service. It has **no real account creation**, donor database, phone masking, hospital verification, or notifications.
- All donor listings and dashboard data are explicitly fictional.
- Medical compatibility and donation eligibility must be determined by qualified medical personnel. Never suggest that an uploaded document has automatically verified a donor.
- For emergency blood needs, people should contact appropriate medical services and blood banks.

## Design-reference interpretation
Uses the user's galleries as inspiration for nav, CTA, visual rhythm, and microinteraction principles; does not copy their components. React-dependent libraries like shadcn/ui and Kokonut UI are deliberately not used because the requested stack is vanilla HTML/CSS/JS + Jinja.
