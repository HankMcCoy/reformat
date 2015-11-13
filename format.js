var recast = require('recast')
var options = {
  useTabs: true,
  tabWidth: 1,
  trailingComma: true,
  quote: 'single',
}

module.exports = function format(source) {
  var out = recast.prettyPrint(recast.parse(source), options).code
  // recast doesn't really respect 'useTabs', hrm
  out = out.replace(/\t /g, '\t\t')
  out = out.replace(/\n /g, '\n\t')

  return out
}
