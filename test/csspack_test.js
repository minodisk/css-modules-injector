'use strict'

const path = require('path')

const assert = require('power-assert')
const cheerio = require('cheerio')

const csspack = require('../lib/csspack')
const fs = require('../lib/promise/fs')
const glob = require('../lib/promise/glob')
const utils = require('./test_utils')

const expected = {}

describe('csspack', () => {
  before(() => {
    return Promise.all([
      'expected/foo.html',
      'expected/bar.html',
      'expected/modified.html',
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

    it('should generate a bundled html file when a new html file is added', () => {
      return csspack({
        context: utils.fixtures,
        entry: 'src/html/**/*.html',
        output: 'dist',
        outWriter: new Buffer(1000),
        watch: true,
      })
        .then((c) => {
          return new Promise((resolve, reject) => {
            c
              .on('add', (e) => {
                if (e.rel !== 'watch_add_test.html') return
                fs.readFile(path.join(utils.fixtures, 'dist/watch_add_test.html'))
                  .then((content) => {
                    assert(content === expected.foo)
                    c.destruct()
                    resolve()
                  })
              })
            fs.readFile(path.join(utils.fixtures, 'src/html/foo.html'))
              .then(content => fs.writeFile(path.join(utils.fixtures, 'src/html/watch_add_test.html'), content))
              .catch(err => reject(err))
          })
        })
    })

    it('should regenerate a bundled html file when a source html file is modified', () => {
      let compiler
      csspack({
        context: utils.fixtures,
        entry: 'src/html/**/*.html',
        output: 'dist',
        outWriter: new Buffer(1000),
        watch: true,
      })
        .then((c) => {
          compiler = c
          return new Promise((resolve, reject) => {
            compiler
              .on('change', (e) => {
                fs.readFile(path.join(utils.fixtures, 'dist/modified.html'))
                  .then((content) => {
                    assert(content === expected.modified)
                    resolve()
                  })
                  .catch(err => reject(err))
              })
              .run()
              .catch(err => reject(err))
            fs.readFile(path.join(utils.fixtures, 'src/html/modified.html'))
              .then((content) => {
                const $ = cheerio.load(content)
                $('h1').text('modified')
                return fs.writeFile(path.join(utils.fixtures, 'src/html/modified.html'), $.html())
              })
              .catch(err => reject(err))
          })
        })
        .catch(err => err)
        .then((err) => {
          compiler.destruct()
          if (err) return Promise.reject(err)
        })
    })

    it('should regenerate bundled html files when a css file is modified', () => {
    })

    it('should remove a bundled html file when a source html file is removed', () => {
    })
  })
})
