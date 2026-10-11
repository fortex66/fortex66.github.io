# Eonsang Son · 3D engineering portfolio

A scroll-led Three.js presentation of industrial equipment, software systems, and manufacturing AI. The opening scene shows the connected system; scrolling or selecting OT / IT / AI moves the camera closer to the relevant equipment. The robot, cooling fans, and data signals animate subtly. These are conceptual visuals, not live equipment telemetry.

Projects, experience, identity, and contact information remain available directly through the navigation, independent of the 3D scene. Project details open in accessible dialogs with filtering and keyboard focus restoration. There are no game mechanics, characters, collectibles, or scores.

## Run

```sh
npm run build
python3 -m http.server 4173
```

GitHub Pages serves the root. `npm run build` also generates `dist/` and content-versioned CSS/JavaScript references to avoid mixing cached assets across deployments. Previously published versioned files are retained for older cached HTML.

## Structure

- `index.html`: four presentation chapters and portfolio dialogs
- `main.css`: responsive presentation and archive styles
- `main.js`: chapter selection, archive filters, and dialog navigation
- `scene.js`: locally modeled equipment, studio lighting, camera transitions, and ambient motion
- `data.js`: project descriptions and links
- `vendor/`: vendored Three.js, without a runtime CDN dependency

Reduced-motion preferences disable ambient motion and use immediate camera changes. Unsupported WebGL leaves descriptions and direct project access available. Rendering pauses while dialogs are open or the page is hidden. Mobile uses a stacked scene/text layout with ordinary page scrolling.

## Verify

With Playwright and Chromium installed and the preview server running:

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tests/showcase.py
```

`PORTFOLIO_URL` overrides the preview URL. `SCREENSHOT_DIR` selects screenshot output. Checks cover chapter navigation, project filters and dialogs, responsive layouts, reduced motion, motion controls, direct section links, and WebGL fallback.

## Visual direction

The studio uses thin machined plinths, coated-metal robot castings, glass rack panels, fine mounting details, and local studio environment reflections. All geometry and material textures are generated locally; no external model or HDR downloads are required. English is used throughout the interface and project descriptions. Original project recordings are preserved and can contain Korean source interfaces.

Reference review: [Sanghoon Lee](https://hun0130.github.io/) for a clear professional identity, [Lusion](https://lusion.co/) for visual storytelling, and [Robin Payot](https://robinpayot.com/) for a portfolio centered on a 3D experience. These informed the direction; their assets, content, and implementations are not reused.
