#!/usr/bin/env node

const csspack = require('../lib/csspack')
const parse = require('../lib/cli').parse

csspack(parse(process.argv.slice(2)))
