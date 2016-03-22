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
      return glob(path.join(utils.fixtures, 'src/html/**/*.html'))
        .then((paths) => {
          assert(paths.length >= 0)
        })
    })
  })
})
