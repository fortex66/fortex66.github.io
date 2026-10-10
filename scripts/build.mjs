import { mkdir, cp, rm, readFile } from "node:fs/promises";
const files = [
  ".nojekyll",
  "index.html",
  "main.css",
  "main.js",
  "data.js",
  "scene.js",
  "assets",
  "vendor",
  "imgs",
];
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const file of files) await cp(file, `dist/${file}`, { recursive: true });
const html = await readFile("dist/index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g))
  await readFile(`dist/${match[1]}`);
console.log("Static site built in dist/; entry point assets verified.");
