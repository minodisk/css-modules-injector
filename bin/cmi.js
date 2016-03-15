#!/usr/bin/env node

const injectWithArgv = require('../lib/inject').injectWithArgv
const colors = require('colors/safe')

injectWithArgv(process.cwd(), process.argv, process.stdout)
  .catch((err) => {
    process.stderr.write(colors.red(err.toString()) + '\n')
  })
