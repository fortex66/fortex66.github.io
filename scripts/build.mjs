import { mkdir, cp, rm, readFile, readdir } from "node:fs/promises";
import { versionAssets } from "./version-assets.mjs";
await versionAssets();
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
files.push(
  ...(await readdir(".")).filter((name) =>
    /^(?:main|data|scene)-[a-f0-9]{12}\.(?:css|js)$/.test(name),
  ),
);
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const file of files) await cp(file, `dist/${file}`, { recursive: true });
const html = await readFile("dist/index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g))
  await readFile(`dist/${match[1]}`);
console.log("Static site built in dist/; entry point assets verified.");
