const fs = require("fs");
const path = require("path");

const swDir = path.resolve(__dirname, "..", "dist-sw");
const distSwDir = path.resolve(__dirname, "..", "dist");

fs.readdirSync(swDir, { withFileTypes: true }).forEach(entry => {
  const srcPath = path.join(swDir, entry.name);
  const destPath = path.join(distSwDir, entry.name);
  fs.copyFileSync(srcPath, destPath);
});