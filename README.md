# Eonsang Son · Engineering Lab

A personal Three.js workspace shaped by Eonsang Son's software and factory experience. A dual-monitor desk, miniature robot bench, original project screens, and a field notebook replace the standalone technology diagrams. This is a conceptual room, not a photograph or reconstruction of a real office.

Select a physical object or its numbered, keyboard-accessible button to open its story:

- **01 — Main monitor:** Water Treatment SCADA
- **02 — Code workspace:** PLC AI Studio
- **03 — Robot and controller bench:** Industrial Embedded Controllers
- **04 — Field notebook:** experience and education

The room, desk, workbench, and notes views move the camera without game controls. All 11 projects, About, Experience, and Contact remain directly accessible through the navigation, independently of WebGL. The interface is English; historical source screenshots retain their original language.

## Run

```sh
npm run build
python3 -m http.server 4173
```

GitHub Pages serves the root. The build also generates `dist/` and content-versioned CSS/JavaScript references to prevent mixed cached revisions. Previously published versioned files remain for older cached HTML.

## Project records and scene assets

`assets/lab/water.webp` and `assets/lab/controller.webp` are lightweight frames extracted at three seconds from the existing `imgs/water.gif` and `imgs/fortex_dif.gif` project recordings. They total about 104 KB; the large original GIFs load only when visitors request a recording in project details.

The PLC AI Studio screen is labeled a concept interface. The notebook, room, furniture, robot, materials, and studio lighting are locally generated visuals. They do not imply ownership of a particular workspace or hardware. No external 3D models, HDR files, or runtime CDNs are required.

## Implementation

- `index.html`: introduction, semantic object buttons, camera controls, and archive dialogs
- `scene.js`: room geometry, original project textures, object raycasting, projected buttons, camera transitions, and ambient motion
- `main.js`: object stories, archive filtering, focus restoration, and view descriptions
- `main.css`: desktop and mobile layouts
- `data.js`: source-backed project records
- `vendor/`: vendored Three.js

Reduced motion disables ambient movement and uses immediate camera changes. Rendering stops while dialogs are open or the page is hidden. Unsupported WebGL preserves direct project access and disables unavailable camera controls.

## Verify

With Playwright, Chromium, and the preview server running:

```sh
CHROMIUM_PATH=/usr/bin/chromium python3 tests/showcase.py
```

`PORTFOLIO_URL` overrides the URL; `SCREENSHOT_DIR` chooses screenshot output. Tests cover physical object selection, four numbered stories and camera views, focus restoration, 11 project records and filters, nested dialogs, responsive portrait/landscape layouts, animation/pause, English interface content, deep links, and WebGL fallback.
