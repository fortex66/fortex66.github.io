# Eonsang Son — Portfolio

A GitHub Pages portfolio connecting industrial control, software, and manufacturing AI. The main page is a fixed, fullscreen playable Three.js **Engineering Island**: move a small explorer between Equipment, Data, and Intelligence to discover career context and related projects. Connecting all three stations lights up the island's engineering circuit. This is a conceptual identity map; it does not display live equipment data.

## Explore the island

- Start exploring, then use WASD or arrow keys while the canvas is focused.
- Approach a station and press E, Enter, or the connect button to discover it.
- Click a station, its label, or a section shortcut to walk there automatically.
- Click a reachable floor position to move; station bases and island edges block movement.
- Mobile visitors can hold the directional buttons. The camera follows the explorer.
- Walk to the information terminal (or select its shortcut) to open Identity, Projects, Experience, and Contact without leaving the island.
- Station cards also link to these terminal sections. Project details open in a second dialog; Escape returns one level at a time.
- The background world pauses while a terminal or project dialog is open. Closing it resumes exploration.
- Collect five golden data chips by walking into them or clicking them to navigate. Each chip grants 20 XP; each first-time station connection grants 100 XP. All five chips and three stations earn the **System Architect** badge at 400 XP. Rewards are optional and never lock portfolio content.
- Hold Shift while moving, or toggle the boost button on desktop/mobile, for faster travel.
- Reset clears discovery, chips, XP, and boost. Progress is session-only and no account is needed.

Reduced motion pauses ambient animation and makes section shortcuts jump directly to their destination; intentional keyboard/touch movement remains available. Without WebGL, section buttons still reveal the zone descriptions and projects alongside a static illustration, and the terminal shortcut opens the portfolio directly. Legacy section URLs open the matching terminal tab.

High quality uses 2× supersampling on ordinary displays (up to 2.5× on high-density screens, capped at an 8-million-pixel framebuffer), antialiasing, smoother curved geometry, and 2048px soft shadows. The **High / Standard** toggle reduces resolution and disables shadows for slower devices.

## Industrial equipment rendering

OT is a purpose-built robot cell with articulated motor housings, a protected cable harness, gripper, fixture table, PLC enclosure, safety mesh, and hazard markings. IT uses a 19-inch server rack, patch leads, glass door, keyboard, and a SCADA workstation. AI uses a GPU workstation with visible boards/heatsinks, cooling fans, and a PLC analysis display. Screen data is clearly labeled as a portfolio demo.

All models and textures are generated locally in Three.js; there are no third-party model downloads. Beveled geometry, studio environment reflections, painted metal, steel, glass, textured concrete, perspective projection, and soft contact shadows give the equipment more physical depth. Stationary cabinets stay on the ground; only the robot arm, cooling fans, and intentional game animations move.

## Work locally

No dependency installation is required. Use Node.js 20+ for the optional build and Python 3 for preview:

```sh
npm run build
npm run preview
```

Open http://localhost:4173. GitHub Pages can serve the root files directly; `dist/` is an optional static deployment artifact. Keep the existing GitHub Pages publishing configuration when merging.

- `index.html`: fullscreen world and terminal dialog with identity, experience, education, and contact
- `data.js`: all 11 projects, roles, tools, sources, and optional demos
- `main.js`: zone descriptions, discovery progress, archive filters, project dialogs
- `scene.js`: 3D island, explorer movement/collisions, click navigation, camera, ambient animation
- `main.css`: responsive layout and visual design

After editing CSS or JavaScript, run `npm run prepare-assets` (also included in
`npm run build`) before committing. This updates the HTML to use filenames
derived from the file contents, preventing new HTML from loading older cached
styles or scripts. Commit the generated versioned files with the source files.
Previous versions remain available for visitors who still have older HTML.

The scene stops rendering outside the viewport or when the browser tab is hidden. Reduced motion starts paused, and WebGL failure retains a static SVG. Large legacy project GIFs load only after a visitor requests a demo.

Three.js **0.180.0** is vendored from its npm release (`three.module.min.js`, `three.core.min.js`) with the MIT license in `vendor/THREE-LICENSE.txt`. No CDN is required at runtime. The water-treatment project credits its collaborator and original project via the project dialog and repository README.

## Browser checks

With `npm run preview` running, install Playwright and its Chromium browser, then run:

```sh
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/island_navigation.py
python3 tests/island_rewards.py
```

`CHROMIUM_PATH` selects a system browser, `PORTFOLIO_URL` changes the server URL, and `SCREENSHOT_DIR` chooses where screenshots are saved. Checks cover terminal navigation, all 11 projects, nested dialogs, world pause, three-station completion, real 3D collectible raycasts, walking pickup, duplicate reward prevention, reset, reduced motion, high/standard quality, responsive layouts, and WebGL fallback.
