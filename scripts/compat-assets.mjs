import { copyFile, readdir } from "node:fs/promises";

const files = await readdir("dist/assets");
const currentJs = `dist/assets/${files.find((file) => /^index-[^.]+\.js$/.test(file))}`;
const currentCss = `dist/assets/${files.find((file) => /^index-[^.]+\.css$/.test(file))}`;

if (currentJs.endsWith("undefined") || currentCss.endsWith("undefined")) {
  throw new Error("Could not find Vite's hashed application assets");
}

const aliases = {
  [currentJs]: ["dist/assets/index-9KYTVFD3.js", "dist/assets/index-DvPteV92.js"],
  [currentCss]: ["dist/assets/index-DR07YVCT.css", "dist/assets/index-BatA-_uk.css"],
};

await Promise.all(
  Object.entries(aliases).flatMap(([source, destinations]) =>
    destinations.map((destination) => copyFile(source, destination)),
  ),
);
