const injectWithBlobs = require('../lib/inject').injectWithBlobs
const fs = require('../lib/promise/fs')
const path = require('path')
const fixturesDir = path.join(__dirname, 'fixtures')

const fooHTML = ``
const barHTML = ``

describe('inject', () => {
  describe('injectWithBlobs', () => {
    it('', () => {
      return injectWithBlobs(fixtureDir, 'src/html/**/*.html', 'src/css/**/*.css', 'dist')
        .then(() => fs.readFile(path.join(__dirname, 'fixtures/dist/foo.html'), fsOptions))
        .then((content) => assert(content === fooHTML))
    })
  })
})
