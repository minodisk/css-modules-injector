const yargs = require('yargs')
const pkg = require('../package.json')

module.exports = yargs
  .locale('en')
  .option('v', {
    alias: 'version',
  }).version(pkg.version)
  .option('h', {
    alias: 'help',
  }).help('h').usage('Usage: $0 [options] <file ...>')
  .option('i', {
    alias: 'input',
    describe: 'Input HTML file glob',
    type: 'string',
    default: '**/*.ejs',
  })
  .option('c', {
    alias: 'css',
    describe: 'Embed CSS file glob',
    type: 'string',
    default: '**/*.css',
  })
  .option('o', {
    alias: 'output',
    describe: 'Output directory',
    type: 'string',
    default: '.',
  })
  .option('w', {
    alias: 'watch',
    describe: 'Watch file',
    type: 'boolean',
    default: false,
  })
