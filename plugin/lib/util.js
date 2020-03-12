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
      return regex.test(file);
    });
  },
  getAbsoluteImportDirectoryPath(babelFilePath, importPath) {
    const importDir = nodepath.dirname(importPath);
    const currentDirPath = nodepath.dirname(babelFilePath);
    return nodepath.resolve(currentDirPath, importDir);
  }
};
