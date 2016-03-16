const path = require('path')
const yargs = require('yargs')
const assign = require('deep-assign')
const pkg = require('../package.json')

const cli = yargs
  .detectLocale(false)
  .help()
  .usage('Usage: $0 [entry] [output]')
  .version(pkg.version)
  .option('context', {
    describe: 'base directory',
  })
  .option('config', {
    describe: 'configuration file',
  })
  .option('colors', {
    describe: 'show colored log',
  })
  .option('watch', {
    describe: 'watch entry files',
  })

/*
 * Parse arguments
 *
 * The strength of settings
 * Default < Configuration < Argv
 */
const parse = (argv) => {
  var options = {
    entry: '**/*.html',
    output: 'dist',
    context: process.cwd(),
    config: 'csspack.config.js',
    colors: true,
    watch: false,
  }

  var c = cli.parse(argv)
  const args = c._
  delete c._
  delete c.v
  delete c.version
  delete c.help
  delete c.$0
  c = assign(c, {
    entry: args[0],
    output: args[1],
  })

  try {
    const tmp = assign({}, options, c)
    const o = require(path.join(tmp.context, tmp.config))
    options = assign(options, o)
  } catch (err) {}

  options = assign(options, c)

  return options
}

module.exports = {
  parse,
}
