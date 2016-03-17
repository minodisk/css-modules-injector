#!/usr/bin/env node

const CSSPack = require('../lib/CSSPack')
const parse = require('../lib/cli').parse

new CSSPack(parse(process.argv.slice(2)), process.stdout, process.stderr)
  .run()
