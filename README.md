# Eonsang Son — Portfolio

A GitHub Pages portfolio connecting industrial control, software, and manufacturing AI. The first screen uses a local Three.js scene with a robot, data server, and AI core. The scene is a conceptual identity map; it does not display live equipment data.

## Work locally

No dependency installation is required. Use Node.js 20+ for the optional build and Python 3 for preview:

```sh
npm run build
npm run preview
```

Open http://localhost:4173. GitHub Pages can serve the root files directly; `dist/` is an optional static deployment artifact. Keep the existing GitHub Pages publishing configuration when merging.

- `index.html`: identity, experience, education, and contact
- `data.js`: all 11 projects, roles, tools, sources, and optional demos
- `main.js`: archive filters and keyboard-accessible project dialogs
- `scene.js`: actual WebGL 3D, pause/resume, reduced motion, and SVG fallback
- `main.css`: responsive layout and visual design

After editing CSS or JavaScript, run `npm run prepare-assets` (also included in
`npm run build`) before committing. This updates the HTML to use filenames
derived from the file contents, preventing new HTML from loading older cached
styles or scripts. Commit the generated versioned files with the source files.
Previous versions remain available for visitors who still have older HTML.

The scene stops rendering outside the viewport or when the browser tab is hidden. Reduced motion starts paused, and WebGL failure retains a static SVG. Large legacy project GIFs load only after a visitor requests a demo.

Three.js **0.180.0** is vendored from its npm release (`three.module.min.js`, `three.core.min.js`) with the MIT license in `vendor/THREE-LICENSE.txt`. No CDN is required at runtime. The water-treatment project credits its collaborator and original project via the project dialog and repository README.
