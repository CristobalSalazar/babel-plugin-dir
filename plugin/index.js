const fs = require("fs");
const nodepath = require("path");
const t = require("@babel/types");

module.exports = function(babel) {
  return {
    name: "dir",
    visitor: {
      ImportDeclaration(path, state) {
        const filepath = state.file.opts.filename;
        const importSource = path.node.source.value;
        const val = path.node.specifiers[0].local.name;
        const regex = /(\.|[d]|[a-z]*)\/\*$/gim;

        if (regex.test(importSource)) {
          const dir = getImportDirectoryPath(filepath, importSource);
          const files = getValidFilesFromDirectory(dir);
          const variableNames = [];
          const declarations = files.map(file => {
            fileId = getUniqueFileIdentifier(dir, file);
            variableNames.push(fileId);
            return createImportDeclaration(fileId, `${dir}/${file}`);
          });

          //path.insertAfter(createVariableDeclaration({}, val));
          path.replaceWithMultiple(declarations);
        }
      }
    }
  };
};

function getObjectProperties(obj) {
  const properties = [];
  for (key in obj) {
    properties.push(t.objectProperty(key, obj[key]));
  }
  return properties;
}

function createVariableDeclaration(obj, name) {
  return t.variableDeclaration(
    "var",
    t.variableDeclarator(t.identifier(name), t.objectExpression(getObjectProperties(obj)))
  );
}

function getValidFilesFromDirectory(dir) {
  return fs.readdirSync(dir, "utf-8").filter(file => {
    const regx = /\.(jsx?$|tsx?$)/g;
    return regx.test(file);
  });
}

function getImportDirectoryPath(babelFilePath, importPath) {
  const importDir = nodepath.dirname(importPath);
  const currentDirPath = nodepath.dirname(babelFilePath);
  return nodepath.resolve(currentDirPath, importDir);
}

function getUniqueFileIdentifier(filedir, filename) {
  let out = filedir.split(nodepath.sep);
  out.push(filename);
  return out
    .join("_")
    .split(".")
    .join("_");
}

function createImportDeclaration(name, src) {
  return t.importDeclaration([t.importDefaultSpecifier(t.identifier(name))], t.stringLiteral(src));
}

function isRelativePath(path) {
  return path.charAt(0) === ".";
}

function isDirectory(path) {
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
}
