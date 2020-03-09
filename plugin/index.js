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
            return createImportDeclaration(
              fileId,
              `${dir}${nodepath.sep}${file}`
            );
          });
          path.insertAfter(
            createVariableDeclaration("var", val, {
              [variableNames[0]]: t.identifier(variableNames[0])
            })
          );
          path.replaceWithMultiple(declarations);
        }
      }
    }
  };
};

function getObjectProperties(obj) {
  const properties = new Array();
  for (key in obj) {
    properties.push(t.objectProperty(t.stringLiteral(key), obj[key]));
  }
  return properties;
}

function createVariableDeclaration(type, name, obj) {
  const isValidVariableType =
    type === "var" || type === "let" || type === "const";

  if (!isValidVariableType) {
    throw new Error("invalid variable type");
  } else {
    return t.variableDeclaration(type, [
      t.variableDeclarator(
        t.identifier(name),
        t.objectExpression(getObjectProperties(obj))
      )
    ]);
  }
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
  return t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier(name))],
    t.stringLiteral(src)
  );
}

function isRelativePath(path) {
  return path.charAt(0) === ".";
}

function isDirectory(path) {
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
}
