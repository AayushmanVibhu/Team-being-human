import { copyFile } from "node:fs/promises";

const aliases = {
  "dist/assets/index.js": [
    "dist/assets/index-9KYTVFD3.js",
    "dist/assets/index-DvPteV92.js",
  ],
  "dist/assets/index.css": [
    "dist/assets/index-DR07YVCT.css",
    "dist/assets/index-BatA-_uk.css",
  ],
};

await Promise.all(
  Object.entries(aliases).flatMap(([source, destinations]) =>
    destinations.map((destination) => copyFile(source, destination)),
  ),
);
