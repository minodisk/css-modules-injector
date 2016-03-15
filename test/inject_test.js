const inject = require('../lib/inject').inject
const fs = require('../lib/promise/fs')
const glob = require('../lib/promise/glob')
const path = require('path')
const utils = require('./test_utils')
const assert = require('power-assert')

const expected = {}

describe('inject', () => {
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

  describe('inject', () => {
    it('should generate files', () => {
      const writer = new Buffer(1000)
      return inject(utils.fixtures, 'src/html/**/*.html', 'dist', writer)
        .then(() => console.log(writer.toString('utf8')))
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
      return inject(utils.fixtures, 'src/html/**/*.html', 'dist', writer)
        .then(() => console.log(writer.toString('utf8')))
        .then(() => glob(path.join(utils.fixtures, 'src/**/.*.?(js|js~)')))
        .then((paths) => assert(paths.length === 0))
    })
  })
})
