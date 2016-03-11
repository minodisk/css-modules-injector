const glob = require('../lib/promise/glob')
const assert = require('power-assert')
const path = require('path')

const cwd = process.cwd()

const absFromCwd = (p) => path.join(cwd, p)
const absFromThis = (p) => path.join(__dirname, p)
const relFromCwd = (p) => path.relative(cwd, absFromThis(p))

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
      return glob(relFromCwd('fixtures/src/css/**/*.css'))
        .then((g) => {
          assert(absFromCwd(g.base) === absFromThis('fixtures/src/css'))
          const actual = g.paths.map((p) => absFromCwd(p))
          const expected = [
            'fixtures/src/css/baz.css',
            'fixtures/src/css/zag/qux.css',
          ].map((p) => absFromThis(p))
          assert(isEqualArray(actual, expected))
        })
    })
  })
})
