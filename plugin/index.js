const fs = require("fs");
const nodepath = require("path");
const t = require("@babel/types");
const _ = require("lodash");

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
          const dir = getAbsoluteImportDirectoryPath(filepath, importSource);
          const files = getValidFilesFromDirectory(dir);

          const declarations = files.map(file => {
            file = trimExtension(file);
            return createImportDeclaration(
              file,
              `${dir}${nodepath.sep}${file}`
            );
          });

          let declarationsMap = _.chain(declarations)
            .keyBy("specifiers[0].local.name")
            .mapValues("specifiers[0].local.name")
            .value();

          path.insertAfter(
            createVariableDeclaration("var", val, declarationsMap)
          );

          path.replaceWithMultiple(declarations);
        }
      }
    }
  };
};

function trimExtension(fileName) {
  if (typeof fileName !== "string") {
    throw new Error("fileName must be of type String");
  }
  const dotIndex = fileName.indexOf(".");
  if (dotIndex === -1) {
    return fileName;
  } else {
    return fileName.substr(0, dotIndex);
  }
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

function getObjectProperties(obj) {
  const properties = new Array();
  for (key in obj) {
    properties.push(
      t.objectProperty(t.identifier(key), t.identifier(obj[key]))
    );
  }
  return properties;
}

function getValidFilesFromDirectory(dir) {
  return fs.readdirSync(dir, "utf-8").filter(file => {
    const regx = /\.(jsx?$|tsx?$)/g;
    return regx.test(file);
  });
}

function getAbsoluteImportDirectoryPath(babelFilePath, importPath) {
  const importDir = nodepath.dirname(importPath);
  const currentDirPath = nodepath.dirname(babelFilePath);
  return nodepath.resolve(currentDirPath, importDir);
}

function createImportDeclaration(name, src) {
  return t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier(name))],
    t.stringLiteral(src)
  );
}
