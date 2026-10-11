# Eonsang Son — The Factory Road

A Three.js portfolio built as one continuous conveyor route with straight project lanes and gently curved career transitions. Eleven stations represent the existing automation, industrial software, applied AI, and web projects. The scene starts immediately, with no entry gate or game mechanics.

## Four views

- **ROAD:** scroll or drag continuously along the conveyor. Small wheel deltas move the camera proportionally; there are no chapter thresholds or automatic jumps. A carrier follows the same path. Select equipment or the current project title action to read its story.
- **OVERVIEW:** the same factory viewed from above, with eleven selectable station markers. Selecting one returns to its exact point on ROAD.
- **LIST:** a direct, text-only index of every project. Open project details or use the adjacent road link to visit its station.
- **ABOUT:** identity, professional experience, education, and contact links.

The header is limited to these views and the name. ROAD shows only the current project title/action, a compact progress scrubber, and motion control. Arrow keys move along the route; Home/End reach its endpoints. Portrait layouts rotate the overview camera to fit the route vertically, with recent work at the top.

## Career sequence

The road and list share three career chapters: SL Corporation (2025.07–present), Industrial Automation Company (employment 2020.10–2023.06; contract work in 2024), and University Years (2018.03–2025.02). These periods overlap, so this is a career-chapter sequence, not a globally date-sorted list. Within a chapter, projects without confirmed dates retain an editorial order; no dates are invented. ForTex-Viewer is dated 2021 at the automation company. Water Treatment SCADA is dated 2024.06–2024.09 and placed in the automation company chapter as contract work commissioned by that company, after the employment period.

## Content and visuals

The factory is a conceptual presentation of the project portfolio, not a reconstruction of an employer's production line. All equipment is original procedural geometry: robot cells, inspection gantries, controllers, tanks, battery modules, and abstract software diagrams. No project photos, screenshots, or GIF recordings are displayed or requested. Historical assets remain for cached versions of the site.

All interface text and diagrams are English. Public project descriptions, roles, dates, collaborators, and links are preserved. Confidential automotive/process descriptions remain abstract. The university name is omitted; the Computer Science bachelor's degree and dates remain.

The navigation follows the user's description of Robin Payot's ROAD / OVERVIEW / LIST / ABOUT experience, adapted into a factory conveyor. No reference code or assets are used.

## Development

```sh
npm run preview
npm run build
```

The local preview uses port 4173. The build verifies `dist/` and regenerates hashed entry-point CSS/JS files. Commit source and matching bundles together for GitHub Pages; retain older tracked bundles for cached HTML.

Three.js is vendored locally. Route geometry, project equipment, diagrams, studio reflections, and typography textures are generated in the browser. Conveyor slats and supports use instanced geometry. No external models, font services, image services, or HDR maps are required.

## Accessibility and fallback

The full portfolio remains available through LIST and ABOUT without WebGL. Equipment picking has equivalent HTML actions. Project dialogs restore focus. Overview markers and the progress slider are keyboard accessible. Reduced motion disables idle motion and easing; the ambient-motion control can also pause the scene. Rendering stops while content panels or dialogs are open, or when the tab is hidden.

## Verification

```sh
CHROMIUM_PATH=/usr/bin/chromium SCREENSHOT_DIR=/absolute/path python3 tests/showcase.py
```

Browser checks cover proportional forward/reverse scrolling; drag, keyboard, and slider controls; all eleven overview markers and route jumps; project dialogs, content, and focus; responsive layouts; motion pause; no photo/recording requests; mode deep links; and WebGL fallback.
