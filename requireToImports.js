// converts commonJS requires to es6 imports
//   var foo = require('foo');
// ->
//   import foo from 'foo';
//
// jscodeshift -t requiresToImports.js src/**/*.js*
'use strict';

module.exports = function(fileInfo, api) {
  var j = api.jscodeshift;

  return j(fileInfo.source)
    .find(j.VariableDeclaration, {
      declarations: [{
        type: 'VariableDeclarator',
        init: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'require',
          },
        },
      }],
    })
    .filter(isTopLevel)
    .forEach(function(path) {
      const dec = path.value.declarations[0];
      const id = dec.id;
      const source = dec.init.arguments[0];

      path.replace(j.importDeclaration([{type: 'ImportDefaultSpecifier', id}], source));
    })
    .toSource({quote: 'single'});
};

function isTopLevel(path) {
  return !path.parentPath.parentPath.parentPath.parentPath;
}
