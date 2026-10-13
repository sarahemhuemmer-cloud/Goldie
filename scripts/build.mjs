import { mkdir, cp, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const file of ["index.html", "src", "assets", "manifest.webmanifest"])
  await cp(file, `dist/${file}`, { recursive: true });
console.log(
  "Goldie-Oberfläche in dist erstellt. API-Server separat bereitstellen; externe Dienste noch nicht verbunden.",
);
