'use strict'

const path = require('path')

const assert = require('power-assert')
const cheerio = require('cheerio')
const del = require('del')

const csspack = require('../lib/csspack')
const CSSPack = csspack.CSSPack
const fs = require('../lib/promise/fs')
const glob = require('../lib/promise/glob')
const utils = require('./test_utils')

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

    it('should generate a bundled html file when a new html file is added', () => {
      let error
      let compiler = new CSSPack({
        context: utils.fixtures,
        entry: 'src/html/**/*.html',
        output: 'dist',
        outWriter: new Buffer(1000),
        watch: true,
      })
      return new Promise((resolve, reject) => {
        compiler
          .on('add', (e) => {
            if (e.rel !== 'watch_add_test.html') return
            fs.readFile(path.join(utils.fixtures, 'dist/watch_add_test.html'))
              .then((content) => {
                assert(content === expected.foo)
                resolve()
              })
              .catch(reject)
          })
          .run()
          .then(() => {
            return fs.readFile(path.join(utils.fixtures, 'src/html/foo.html'))
              .then(content => fs.writeFile(path.join(utils.fixtures, 'src/html/watch_add_test.html'), content))
              .catch(reject)
          })
      })
        .catch(err => error = err)
        .then(() => {
          compiler.destruct()
          if (error) return Promise.reject(error)
        })
    })

    describe('events', () => {
      let beforeContent
      const srcPath = path.join(utils.fixtures, 'src/html/watch_modify_test.html')

      beforeEach(() => {
        return fs.readFile(path.join(utils.fixtures, 'src/html/foo.html'))
          .then((content) => {
            beforeContent = content
            return fs.writeFile(srcPath, beforeContent)
          })
      })

      it('should regenerate a bundled html file when a source html file is modified', () => {
        let error
        let compiler = new CSSPack({
          context: utils.fixtures,
          entry: 'src/html/**/*.html',
          output: 'dist',
          outWriter: new Buffer(1000),
          watch: true,
        })
        return new Promise((resolve, reject) => {
          compiler
            .on('change', (e) => {
              if (e.rel !== 'watch_modify_test.html') return
              fs.readFile(path.join(utils.fixtures, 'dist/watch_modify_test.html'))
                .then((content) => {
                  assert(content === expected.foo.replace('<h1>foo</h1>', '<h1>mod</h1>'))
                  resolve()
                })
                .catch(reject)
            })
            .run()
            .then(() => {
              const $ = cheerio.load(beforeContent)
              $('h1').text('mod')
              return fs.writeFile(srcPath, $.html())
            })
            .catch(reject)
        })
          .catch(err => error = err)
          .then(() => {
            compiler.destruct()
            if (error) return Promise.reject(error)
          })
      })

      it('should remove a bundled html file when a source html file is removed', () => {
        let error
        let compiler = new CSSPack({
          context: utils.fixtures,
          entry: 'src/html/**/*.html',
          output: 'dist',
          outWriter: new Buffer(1000),
          watch: true,
        })
        return new Promise((resolve, reject) => {
          compiler
            .on('unlink', (e) => {
              if (e.rel !== 'watch_modify_test.html') return
              fs.stat(path.join(utils.fixtures, 'dist/watch_modify_test.html'))
                .then(() => reject("shouldn't exist"))
                .catch(() => resolve())
            })
            .run()
            .then(() => del([srcPath]))
            .catch(reject)
        })
          .catch(err => error = err)
          .then(() => {
            compiler.destruct()
            if (error) return Promise.reject(error)
          })
      })
    })

    it('should regenerate bundled html files when a css file is modified', () => {
    })
  })
})
