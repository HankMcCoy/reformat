#! /usr/bin/env node

var exec = require('child_process').exec;
var fs = require('fs');
var recast = require('recast')
var options = {
  useTabs: true,
  tabWidth: 1,
  trailingComma: true,
  quote: 'single',
}

function format(file, callback) {
  fs.readFile(file, function(err, source) {
    if (err) {
      console.log(err)
      return;
    }
    source = source.toString();
    try {
        var out = recast.prettyPrint(recast.parse(source), options).code
        // recast doesn't really respect 'useTabs', hrm
        out = out.replace(/\t /g, '\t\t')
        out = out.replace(/\n /g, '\n\t')
        out = out.replace(/: function\((.*)\)/g, '\($1\)')
        out = out.replace(/function\((.*)\)/g, '\($1\) =>')
        fs.writeFile(file, out, function(err) {
          if (err) {
            console.log(err)
          }
          callback();
        });
    } catch(err) {
      console.log(err)
    }
  });
}

var file = process.argv[2]
exec('jscodeshift -t '+__dirname+'/no-vars.js ' + file, function(error, stdout, stderr) {
  exec('jscodeshift -t '+__dirname+'/requireToImports.js ' + file, function(error, stdout, stderr) {
    format(file, function() {
      exec('eslint --fix '+file)
    })
  })
})
