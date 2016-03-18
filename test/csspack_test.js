'use strict'

const csspack = require('../lib/csspack')
const fs = require('../lib/promise/fs')
const glob = require('../lib/promise/glob')
const path = require('path')
const utils = require('./test_utils')
const assert = require('power-assert')

const expected = {}

describe('csspack', () => {
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

  it('should generate files', () => {
    const writer = new Buffer(1000)
    return csspack({
      context: utils.fixtures,
      entry: 'src/html/**/*.html',
      output: 'dist',
      outWriter: writer,
    })
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
    return csspack({
      context: utils.fixtures,
      entry: 'src/html/**/*.html',
      output: 'dist',
      outWriter: writer,
    })
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

  describe('with watch option', () => {

    it('should generate a bundled html when a new html is added', () => {
      return csspack({
        context: utils.fixtures,
        entry: 'src/html/**/*.html',
        output: 'dist',
        outWriter: new Buffer(1000),
        watch: true,
      })
        .then((c) => {
          return Promise.resolve()
            .then(() => {
              return new Promise((resolve, reject) => {
                c
                  .on('generate', (e) => {
                    if (e.rel !== 'watch_test.html') return
                    fs.readFile(path.join(utils.fixtures, 'dist/watch_test.html'))
                      .then((content) => {
                        assert(content === expected.foo)
                        resolve()
                      })
                  })
                fs.readFile(path.join(utils.fixtures, 'src/html/foo.html'))
                  .then(content => fs.writeFile(path.join(utils.fixtures, 'src/html/watch_test.html'), content))
                  .catch(err => reject(err))
              })
            })
        })
    })

    it('should regenerate a bundled html when a source html is modified', () => {
    })
  })
})
