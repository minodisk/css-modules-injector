const assert = require('power-assert')
const path = require('path')
const execFile = require('child_process').execFile
const pkg = require('../package.json')
const bin = path.join(__dirname, '../bin/cmi.js')
const fs = require('../lib/promise/fs')
const glob = require('../lib/promise/glob')

const pexecFile = (file, args, options) => {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (err, stdout, stderr) => {
      if (err != null) {
        reject(err)
        return
      }
      resolve(stdout, stderr)
    })
  })
}

const trimBreakline = (str) => str.replace(/\n$/, '')

const cleanUp = () => {
  return glob(path.join(__dirname, 'fixtures/**/*.html'))
    .then((g) => {
      return Promise.all(
        g.paths.map((path) => fs.unlink(path))
      )
    })
}

describe('bin', () => {
  afterEach(() => {
    return cleanUp()
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
