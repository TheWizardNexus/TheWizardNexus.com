import { cp, mkdir, readFile, rm, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
// The sitemap is the public page inventory. Design previews stay in the workspace.
const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => {
  const name = new URL(value).pathname.split("/").pop() || "index.html";
  if (!/^[a-z0-9-]+\.html$/.test(name)) throw new Error(`Invalid public page: ${name}`);
  return name;
});
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const name of new Set([...pages, "404.html", "assets", "data", "styles.css", "ecosystem-diagram.css", "app.js", "robots.txt", "sitemap.xml", ".nojekyll"])) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
for (const name of ["CNAME", "zen-sentry-foundation"]) {
  try { await access(path.join(root, name)); } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
console.log(`Built ${pages.length} public pages plus 404; design previews excluded.`);
