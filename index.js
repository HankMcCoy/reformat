#! /usr/bin/env node

var path = require('path');
var execSync = require('child_process').execSync;
var fs = require('fs');
var eslint = require('eslint');

var format = require('./format');

var linter = new eslint.CLIEngine({ fix: true });
var inputPath = process.argv[2];

function runFormat(file) {
  var source = fs.readFileSync(file, { encoding: 'utf8' });

  fs.writeFileSync(file, format(source));
}

function runTransform(transform) {
  execSync('node_modules/jscodeshift/bin/jscodeshift.sh -t ' + path.join(__dirname, transform) + ' ' + inputPath);
}

function applyFix(messages, fix, ruleId) {
  var filteredMessages = messages.filter(function (message) {
		console.log(message.ruleId)
    return message.ruleId === ruleId
  })

  if (filteredMessages.length) {
    var fileContents = fs.readFileSync(inputPath, { encoding: 'utf8' })
    var fileLines = fileContents.split('\n')

    filteredMessages.forEach(function (msg) {
      fix(fileLines, msg.line - 1)
    })

		fileLines = fileLines.filter(function (lineContent) {
			return lineContent !== '__DELETE_ME__'
		})

    fs.writeFileSync(inputPath, fileLines.join('\n'), { encoding: 'utf8' })
  }
}

function fixCommas(fileLines, line) {
  fileLines[line] = fileLines[line] + ','
}

function fixPaddedBlocks(fileLines, line) {
  var isStart = /\{$/.test(fileLines[line])

  fileLines[line + (isStart ? 1 : -1)] = '__DELETE_ME__'
}

function fixQuotes(fileLines, line) {
	console.log('QUOTE LINE', fileLines[line])
	fileLines[line] = fileLines[line].replace(/"/g, "'")
}

function fixLintErrors() {
  var report = linter.executeOnFiles([inputPath])
  var results = report.results || []

  if (report.errorCount || report.warningCount) {
    results.forEach(function (result) {
      applyFix(result.messages, fixCommas, 'comma-dangle')
      applyFix(result.messages, fixPaddedBlocks, 'padded-blocks')
      applyFix(result.messages, fixQuotes, 'quotes')
    })
  }
}

runTransform('no-vars.js');
runTransform('requireToImports.js');
execSync('node_modules/js-beautify/js/bin/js-beautify.js -t -a -n -r -f ' + inputPath);
fixLintErrors();
execSync('node_modules/semi/bin/semi rm ' + inputPath);
