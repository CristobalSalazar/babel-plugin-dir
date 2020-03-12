const fs = require("fs");
const path = require("path");

module.exports = {
  trimExtension(fileName) {
    if (typeof fileName !== "string") {
      throw new Error("fileName must be of type String");
    }
    const dotIndex = fileName.indexOf(".");
    if (dotIndex === -1) {
      return fileName;
    } else {
      return fileName.substr(0, dotIndex);
    }
  },
  getValidFilesFromDirectory(dir, regx) {
    return fs.readdirSync(dir, "utf-8").filter(file => {
      return regx.test(file);
    });
  },
  getAbsoluteImportDirectoryPath(babelFilePath, importPath) {
    const importDir = path.dirname(importPath);
    const currentDirPath = path.dirname(babelFilePath);
    return path.resolve(currentDirPath, importDir);
  }
};
