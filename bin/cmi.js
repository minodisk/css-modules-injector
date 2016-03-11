#!/usr/bin/env node

const cli = require('../lib/cli')
const argv = cli.parse(process.argv)
const injectWithOptions = require('../lib/inject').injectWithOptions

injectWithOptions(process.cwd(), argv)
  .catch((err) => {
    console.error(err.toString())
  })
