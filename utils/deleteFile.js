const fs = require("fs");
const path = require("path");

module.exports = function deleteFile(filePath) {
  if (!filePath) return;

  // never delete default images
  if (filePath.includes("default")) return;

  const fullPath = path.join("public", filePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};
