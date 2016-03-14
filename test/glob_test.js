const glob = require('../lib/promise/glob')
const assert = require('power-assert')
const path = require('path')
const utils = require('./test_utils')

const isEqualArray = (a, b) => {
  b = b.slice()
  return a.length === b.length &&
  a.every((el) => {
    const i = b.indexOf(el)
    if (i < 0) return false
    b.splice(i, 1)
    return true
  })
}

describe('promise', () => {
  describe('glob', () => {
    it('should parse base and find paths', () => {
      return glob(path.join(utils.fixturesPath, 'src/html/**/*.html'))
        .then((paths) => {
          const actual = paths.map((p) => path.relative(utils.fixturesPath, p))
          const expected = [
            'src/html/foo.html',
            'src/html/zig/bar.html',
          ]
          assert(isEqualArray(actual, expected))
        })
    })
  })
})
