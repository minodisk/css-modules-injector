const CSSPack = require('../lib/csspack')
const fs = require('../lib/promise/fs')
const glob = require('../lib/promise/glob')
const path = require('path')
const utils = require('./test_utils')
const assert = require('power-assert')

const expected = {}

describe('CSSPack', () => {
  before(() => {
    return Promise.all([
      'expected/foo.html',
      'expected/bar.html',
    ].map((p) => {
      const name = path.basename(p, path.extname(p))
      return fs.readFile(path.join(utils.fixtures, p))
        .then((content) => expected[name] = content)
    }))
  })

  afterEach(() => {
    return utils.cleanUp()
  })

  describe('constructor', () => {
    it('should generate files', () => {
      const writer = new Buffer(1000)
      return new CSSPack({
        context: utils.fixtures,
        entry: 'src/html/**/*.html',
        output: 'dist',
      }, writer)
        .run()
        .then(() => {
          assert(writer.toString().indexOf('Hash') === 0)
        })
        .then(() => Promise.all([
          fs.readFile(path.join(utils.fixtures, 'dist/foo.html')),
          fs.readFile(path.join(utils.fixtures, 'dist/zig/bar.html')),
        ]))
        .then((contents) => {
          assert(contents[0] === expected.foo)
          assert(contents[1] === expected.bar)
        })
    })

    it('should clean up temporary files', () => {
      const writer = new Buffer(1000)
      return new CSSPack({
        context: utils.fixtures,
        entry: 'src/html/**/*.html',
        output: 'dist',
      }, writer)
        .run()
        .then(() => {
          assert(writer.toString().indexOf('Hash') === 0)
        })
        .catch((err) => {
          console.log('catch err')
        })
        .then(() => glob(path.join(utils.fixtures, 'src/**/.*.?(js|js~)')))
        .then((paths) => {
          assert(paths.length === 0)
        })
    })
  })
})
