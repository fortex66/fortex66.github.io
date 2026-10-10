import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

// GitHub Pages caches static files. The HTML and its CSS/JS must use the
// same revision even when a visitor has earlier files in their browser cache.
export async function versionAssets() {
  let html = await readFile("index.html", "utf8");
  for (const [stem, extension] of [
    ["main", "css"],
    ["data", "js"],
    ["main", "js"],
    ["scene", "js"],
  ]) {
    const content = await readFile(`${stem}.${extension}`);
    const digest = createHash("sha256").update(content).digest("hex").slice(0, 12);
    const filename = `${stem}-${digest}.${extension}`;
    await writeFile(filename, content);
    const reference = new RegExp(
      `(src|href)="\\./${stem}(?:-[a-f0-9]{12})?\\.${extension}"`,
      "g",
    );
    html = html.replace(reference, `$1="./${filename}"`);
  }
  await writeFile("index.html", html);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await versionAssets();
  console.log("CSS and JavaScript use content-versioned URLs.");
}
