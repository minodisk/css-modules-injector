#!/usr/bin/env node

const cli = require('../lib/cli')
const argv = cli.parse(process.argv)
const inject = require('../lib/inject').injectWithOptions

inject(argv)
  .catch((err) => {
    console.error(err.toString())
  })
