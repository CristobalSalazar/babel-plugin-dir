const fs = require("fs");
const nodepath = require("path");
const t = require("@babel/types");
const _ = require("lodash");
const {
  getAbsoluteImportDirectoryPath,
  getValidFilesFromDirectory,
  trimExtension
} = require("./lib/util");

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
          const validFiles = /\.(jsx?$|tsx?$)/g;
          const files = getValidFilesFromDirectory(dir, validFiles);

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

function createImportDeclaration(name, src) {
  return t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier(name))],
    t.stringLiteral(src)
  );
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
