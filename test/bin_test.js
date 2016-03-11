const assert = require('power-assert')
const path = require('path')
const execFile = require('child_process').execFile
const pkg = require('../package.json')
const bin = path.join(__dirname, '../bin/cmi.js')
const fs = require('../lib/promise/fs')
const utils = require('./test_utils')

const pexecFile = (file, args, options) => {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (err, stdout, stderr) => {
      if (err) return reject(err)
      resolve(stdout, stderr)
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
        .then((stdout, stderr) => {
          assert(stdout.indexOf('Usage:') !== -1)
          assert(stdout.indexOf('Options:') !== -1)
          assert(stderr === undefined)
        })
    })
  })

  describe('--version', () => {
    it('should be equal to the version in package.json', () => {
      return pexecFile(bin, ['--version'])
        .then((stdout, stderr) => {
          assert(trimBreakline(stdout) === pkg.version)
          assert(stderr === undefined)
        })
    })
  })

  describe('no args', () => {
  })

  describe('--input, --css, --output', () => {
  })
})
