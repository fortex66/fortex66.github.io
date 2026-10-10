# Eonsang Son — Factory Playground

A fullscreen Three.js portfolio connecting industrial control, software, and manufacturing AI. Visitors arrange a small factory, connect robot cells to SCADA and AI, and start a simulated production line. Every module links to the related real projects; all 11 projects, experience, education, and contact remain available in the portfolio terminal.

## Build a factory

- Add up to eight robot, SCADA, and AI modules. Select a module, then click an empty floor position to move it. The grid snaps to half-unit increments and rejects overlapping or out-of-bounds placement.
- Use **Connect** mode to select a source and destination: robot → SCADA, then SCADA → AI. **Auto connect** creates a valid example line. Multiple robots can share SCADA and AI.
- Start production once at least one complete chain exists. The robot arms and data packets animate; the demo counter increments for complete robot lines. The desktop speed slider changes the simulation rate. This is a conceptual simulation, not real equipment telemetry or an AI service.
- Rotate, disconnect, remove, or inspect the selected device. Arrow keys move the selected module while the canvas has focus; Q/E rotate. Escape or **Done** clears selection.
- Drag empty floor to orbit, use the wheel or camera buttons to zoom, or restore the initial viewpoint. Touch visitors use drag and the same camera buttons.
- Undo restores up to 30 layout edits. **Example layout** restores the initial three devices; **Empty factory** starts from a clean floor. Layout and production are session-only.
- Open **Real projects** for a selected device, or the top-right **Portfolio** terminal for all content. Nested project dialogs return one level at a time with Escape. Dialogs and hidden browser tabs pause simulation.

The interface uses 17–18px primary descriptions and 16–18px desktop controls, with 14–16px mobile controls instead of tiny captions. High quality uses 2× supersampling on ordinary displays (up to 2.5×, capped at an 8-million-pixel framebuffer), antialiasing, smooth curves, and 2048px soft shadows. The quality toggle reduces resolution and disables shadows for slower devices. Reduced motion stops ambient/device animation while keeping intentional edits and the production counter available. Without WebGL, the model palette opens related project details and the terminal remains usable.

## Work locally

No dependency installation is required. Use Node.js 20+ for the optional build and Python 3 for preview:

```sh
npm run build
npm run preview
```

Open http://localhost:4173. GitHub Pages can serve the root files directly; `dist/` is an optional static deployment artifact. Keep the existing GitHub Pages publishing configuration when merging.

- `index.html`: factory controls and portfolio dialogs
- `data.js`: all 11 projects, roles, tools, sources, and optional demos
- `main.js`: device identity descriptions, archive filters, and nested portfolio dialogs
- `scene.js`: procedural models, layout/connection editing, undo, production simulation, and camera
- `main.css`: responsive layout and visual design

After editing CSS or JavaScript, run `npm run prepare-assets` (also included in
`npm run build`) before committing. This updates the HTML to use filenames
derived from the file contents, preventing new HTML from loading older cached
styles or scripts. Commit the generated versioned files with the source files.
Previous versions remain available for visitors who still have older HTML.

The scene stops rendering when a dialog is open or the browser tab is hidden. Reduced motion starts paused, and WebGL failure retains a static SVG. Large legacy project GIFs load only after a visitor requests a demo.

Three.js **0.180.0** is vendored from its npm release (`three.module.min.js`, `three.core.min.js`) with the MIT license in `vendor/THREE-LICENSE.txt`. No CDN is required at runtime. The water-treatment project credits its collaborator and original project via the project dialog and repository README.

## Browser checks

Serve the site with `npm run preview` in one terminal, then run the browser checks in another:

```sh
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/factory_interactions.py
python3 tests/factory_rendering.py
```

Set `CHROMIUM_PATH` to use a system Chromium executable, `PORTFOLIO_URL` to test a different server, or `SCREENSHOT_DIR` to keep the screenshots in a chosen directory. Tests cover manual/automatic connections, production, collision rejection, editing/undo, raycasts, camera controls, eight-module limits, nested dialogs, responsive layout, reduced motion, quality, and WebGL fallback.
