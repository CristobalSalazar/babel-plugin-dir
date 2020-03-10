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
          const declarations = getImportDeclarationsFromFiles(files, dir, path);

          let declarationsMap = _.chain(declarations)
            .keyBy("specifiers[0].local.name")
            .mapValues("specifiers[0].local")
            .value();

          declarationsMap = _.mapKeys(declarationsMap, key => {
            return trimExtension(new String(key));
          });

          path.insertAfter(
            createVariableDeclaration("var", val, declarationsMap)
          );

          path.replaceWithMultiple(declarations);
        }
      }
    }
  };
};

function getImportDeclarationsFromFiles(files, dir, path) {
  return files.map(file => {
    const uid = path.scope.generateUid(file);
    return createImportDeclaration(uid, `${dir}${nodepath.sep}${file}`);
  });
}

function trimExtension(fileName) {
  const dotIndex = fileName.indexOf(".");
  if (dotIndex === -1) {
    return fileName;
  } else {
    return fileName.substr(0, dotIndex);
  }
}

function getObjectProperties(obj) {
  const properties = new Array();
  for (key in obj) {
    console.log(obj[key]);
    properties.push(t.objectProperty(t.identifier(key), obj[key]));
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
