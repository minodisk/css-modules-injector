const assert = require('power-assert')
const path = require('path')
const execFile = require('child_process').execFile
const pkg = require('../package.json')
const fs = require('../lib/promise/fs')
const utils = require('./test_utils')
const bin = path.join(__dirname, '../bin/csspack.js')

const pexecFile = (file, args, options) => {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (err, stdout, stderr) => {
      if (err) return reject(err)
      resolve({stdout, stderr})
    })
  })
}

const trimBreakline = (str) => str.replace(/\n$/, '')

describe('bin', () => {
  afterEach(() => {
    return utils.cleanUp()
  })

  describe('--help', () => {
    it('should contain usage and options', () => {
      return pexecFile(bin, ['--help'])
        .then((result) => {
          assert(result.stdout.indexOf('Usage:') !== -1)
          assert(result.stdout.indexOf('Options:') !== -1)
          assert(result.stderr === '')
        })
    })
  })

  describe('--version', () => {
    it('should be equal to the version in package.json', () => {
      return pexecFile(bin, ['--version'])
        .then((result) => {
          assert(trimBreakline(result.stdout) === pkg.version)
          assert(result.stderr === '')
        })
    })
  })
})
