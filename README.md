# Eonsang Son — Interactive Portfolio

A full-screen Three.js portfolio built around Eonsang's identity, career, and projects. Seven spatial chapters replace the former engineering-room scene: a dimensional signature, experience timeline, PLC AI Studio, Water Treatment SCADA, industrial control, selected projects, and contact.

Scroll, drag/swipe, use the arrow keys, or select a chapter from Overview. The project index provides direct access to all 11 existing records. The site starts immediately; there is no game, score, mission, or entry gate.

## Visuals and content

- Original extruded typography, reflective geometry, layered controller assemblies, and canvas-drawn system diagrams.
- **No project screenshots, photographs, or recordings are displayed or requested.** Project panels describe architecture and responsibilities with text and original diagrams. Historical media files remain in the repository for older cached pages.
- Diagram labels are based on the existing portfolio records. They are conceptual explanations, not live telemetry or product screenshots.
- The interface and diagrams are English. Career and education dates are retained from the existing portfolio; no university name is displayed.
- Robin Payot's portfolio was requested as a reference for an immersive, full-screen, scroll-driven presentation. Public site information was reviewed, but the reference's live 3D experience could not be executed in the development environment. No reference code, imagery, or models are bundled.

## Run and build

```sh
npm run preview
npm run build
```

The preview serves the checkout at `http://localhost:4173`. The build produces `dist/`, verifies entry-point assets, and updates the hashed CSS/JS filenames in `index.html`. Commit those generated assets with source changes so GitHub Pages serves matching versions. Older tracked bundles remain for cached HTML.

Three.js is vendored locally. The scene needs no external models, fonts, images, or HDR environments. The local `assets/immersive/letterforms.json` contains normalized glyph outlines from DejaVu Sans Bold; its license is included alongside it. Studio reflections and project diagrams are generated in the browser.

## Accessibility and resilience

Chapter buttons, project actions, a filterable project index, and standard dialogs provide access independently of canvas picking. Dialogs restore focus to the originating control. Reduced motion disables idle animation and makes camera transitions immediate; a separate motion toggle is available. Rendering pauses while the page is hidden or dialogs are open. If WebGL fails or its context is lost, the chapter navigation and all project details remain available.

## Verification

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tests/showcase.py
```

Playwright covers all seven chapter actions; keyboard, wheel, drag, and overview navigation; actual 3D diagram picking; all 11 project details and filters; nested dialogs and focus return; portrait and landscape layouts; animation/pause; English interface; deep links; and unavailable-WebGL fallback. Network assertions ensure project screenshots and recordings are not requested. Screenshots can be saved with `SCREENSHOT_DIR=/absolute/path`.
