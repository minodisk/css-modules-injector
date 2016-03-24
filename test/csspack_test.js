'use strict'

const path = require('path')

const assert = require('power-assert')
const cheerio = require('cheerio')
const css = require('css')
const del = require('del')

const csspack = require('../lib/csspack')
const CSSPack = csspack.CSSPack
const fs = require('../lib/promise/fs')
const glob = require('../lib/promise/glob')
const utils = require('./test_utils')

const expected = {}

const sourceMappingURL = css => css.match(/sourceMappingURL=(\S+)/m)[1]

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
    // return utils.cleanUp()
  })

  it('should generate files', () => {
    const writer = new Buffer(1000)
    return csspack({
      context: utils.fixtures,
      entry: 'src/html/**/*.html',
      output: 'dist',
      outWriter: require('os').stdout,
    })
      .then(() => fs.readFile(path.join(utils.fixtures, 'dist/foo.html')))
      .then((content) => {
        const $ = cheerio.load(content)
        {
        const ast = css.parse($('style').eq(0).text())
        assert(ast.stylesheet.rules[0].type === 'rule')
        assert(ast.stylesheet.rules[0].selectors[0] === '.yw-QzTzn815548qkIxFLf')
        assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
        assert(ast.stylesheet.rules[0].declarations[0].value === 'red')
        assert(ast.stylesheet.rules[1].type === 'comment')
        assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy9iYXouY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBVztDQUNaIiwiZmlsZSI6ImJhei5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyI6bG9jYWwgLmNvbG9yZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
        }
        {
        const ast = css.parse($('style').eq(1).text())
        assert(ast.stylesheet.rules[0].type === 'rule')
        assert(ast.stylesheet.rules[0].selectors[0] === '._18xqcZJ7ZRzog895KtSs9p')
        assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
        assert(ast.stylesheet.rules[0].declarations[0].value === 'green')
        assert(ast.stylesheet.rules[1].type === 'comment')
        assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy96YWcvcXV4LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGFBQWE7Q0FDZCIsImZpbGUiOiJxdXguY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmxvY2FsIC5jb2xvcmVkIHtcbiAgY29sb3I6IGdyZWVuO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
        }
        assert($('h1').text() === 'foo')
        assert($('li').eq(0).attr('class') === 'yw-QzTzn815548qkIxFLf')
        assert($('li').eq(1).attr('class') === '_18xqcZJ7ZRzog895KtSs9p')
      })
      .then(() => fs.readFile(path.join(utils.fixtures, 'dist/zig/bar.html')))
      .then((content) => {
        const $ = cheerio.load(content)
        {
        const ast = css.parse($('style').eq(0).text())
        assert(ast.stylesheet.rules[0].type === 'rule')
        assert(ast.stylesheet.rules[0].selectors[0] === '.yw-QzTzn815548qkIxFLf')
        assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
        assert(ast.stylesheet.rules[0].declarations[0].value === 'red')
        assert(ast.stylesheet.rules[1].type === 'comment')
        assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy9iYXouY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBVztDQUNaIiwiZmlsZSI6ImJhei5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyI6bG9jYWwgLmNvbG9yZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
        }
        {
        const ast = css.parse($('style').eq(1).text())
        assert(ast.stylesheet.rules[0].type === 'rule')
        assert(ast.stylesheet.rules[0].selectors[0] === '._18xqcZJ7ZRzog895KtSs9p')
        assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
        assert(ast.stylesheet.rules[0].declarations[0].value === 'green')
        assert(ast.stylesheet.rules[1].type === 'comment')
        assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy96YWcvcXV4LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGFBQWE7Q0FDZCIsImZpbGUiOiJxdXguY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmxvY2FsIC5jb2xvcmVkIHtcbiAgY29sb3I6IGdyZWVuO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
        }
        assert($('h1').text() === 'bar')
        assert($('li').eq(0).attr('class') === 'yw-QzTzn815548qkIxFLf')
        assert($('li').eq(1).attr('class') === '_18xqcZJ7ZRzog895KtSs9p')
      })
  })

// it('should clean up temporary files', () => {
//   const writer = new Buffer(1000)
//   return csspack({
//     context: utils.fixtures,
//     entry: 'src/html/**/*.html',
//     output: 'dist',
//     outWriter: writer,
//   })
//     .then(() => {
//       assert(writer.toString().indexOf('Hash') === 0)
//     })
//     .catch((err) => {
//       console.log('catch err')
//     })
//     .then(() => glob(path.join(utils.fixtures, 'src/**/.*.?(js|js~)')))
//     .then((paths) => {
//       assert(paths.length === 0)
//     })
// })
//
// describe('with watch option', () => {
//
//   it('should generate a bundled html file when a new html file is added', () => {
//     let error
//     let compiler = new CSSPack({
//       context: utils.fixtures,
//       entry: 'src/html/**/*.html',
//       output: 'dist',
//       outWriter: new Buffer(1000),
//       watch: true,
//     })
//     return new Promise((resolve, reject) => {
//       compiler
//         .on('add', (e) => {
//           if (e.rel !== 'watch_add_test.html') return
//           fs.readFile(path.join(utils.fixtures, 'dist/watch_add_test.html'))
//             .then((content) => {
//               const $ = cheerio.load(content)
//               {
//               const ast = css.parse($('style').eq(0).text())
//               assert(ast.stylesheet.rules[0].type === 'rule')
//               assert(ast.stylesheet.rules[0].selectors[0] === '.yw-QzTzn815548qkIxFLf')
//               assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
//               assert(ast.stylesheet.rules[0].declarations[0].value === 'red')
//               assert(ast.stylesheet.rules[1].type === 'comment')
//               assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy9iYXouY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBVztDQUNaIiwiZmlsZSI6ImJhei5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyI6bG9jYWwgLmNvbG9yZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
//               }
//               {
//               const ast = css.parse($('style').eq(1).text())
//               assert(ast.stylesheet.rules[0].type === 'rule')
//               assert(ast.stylesheet.rules[0].selectors[0] === '._18xqcZJ7ZRzog895KtSs9p')
//               assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
//               assert(ast.stylesheet.rules[0].declarations[0].value === 'green')
//               assert(ast.stylesheet.rules[1].type === 'comment')
//               assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy96YWcvcXV4LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGFBQWE7Q0FDZCIsImZpbGUiOiJxdXguY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmxvY2FsIC5jb2xvcmVkIHtcbiAgY29sb3I6IGdyZWVuO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
//               }
//               assert($('h1').text() === 'foo')
//               assert($('li').eq(0).attr('class') === 'yw-QzTzn815548qkIxFLf')
//               assert($('li').eq(1).attr('class') === '_18xqcZJ7ZRzog895KtSs9p')
//               resolve()
//             })
//             .catch(reject)
//         })
//         .run()
//         .then(() => {
//           return fs.readFile(path.join(utils.fixtures, 'src/html/foo.html'))
//             .then(content => fs.writeFile(path.join(utils.fixtures, 'src/html/watch_add_test.html'), content))
//             .catch(reject)
//         })
//     })
//       .catch(err => error = err)
//       .then(() => {
//         compiler.destruct()
//         if (error) return Promise.reject(error)
//       })
//   })
//
//   describe('events', () => {
//     let beforeContent
//     const srcPath = path.join(utils.fixtures, 'src/html/modify_test.html')
//
//     beforeEach(() => {
//       return fs.readFile(path.join(utils.fixtures, 'src/html/foo.html'))
//         .then((content) => {
//           beforeContent = content
//           return fs.writeFile(srcPath, beforeContent)
//         })
//     })
//
//     it('should regenerate a bundled html file when a source html file is modified', () => {
//       let error
//       let compiler = new CSSPack({
//         context: utils.fixtures,
//         entry: 'src/html/**/*.html',
//         output: 'dist',
//         outWriter: new Buffer(1000),
//         watch: true,
//       })
//       return new Promise((resolve, reject) => {
//         compiler
//           .on('change', (e) => {
//             if (e.rel !== 'modify_test.html') return
//             fs.readFile(path.join(utils.fixtures, 'dist/modify_test.html'))
//               .then((content) => {
//                 const $ = cheerio.load(content)
//                 {
//                 const ast = css.parse($('style').eq(0).text())
//                 assert(ast.stylesheet.rules[0].type === 'rule')
//                 assert(ast.stylesheet.rules[0].selectors[0] === '.yw-QzTzn815548qkIxFLf')
//                 assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
//                 assert(ast.stylesheet.rules[0].declarations[0].value === 'red')
//                 assert(ast.stylesheet.rules[1].type === 'comment')
//                 assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy9iYXouY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0UsV0FBVztDQUNaIiwiZmlsZSI6ImJhei5jc3MiLCJzb3VyY2VzQ29udGVudCI6WyI6bG9jYWwgLmNvbG9yZWQge1xuICBjb2xvcjogcmVkO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
//                 }
//                 {
//                 const ast = css.parse($('style').eq(1).text())
//                 assert(ast.stylesheet.rules[0].type === 'rule')
//                 assert(ast.stylesheet.rules[0].selectors[0] === '._18xqcZJ7ZRzog895KtSs9p')
//                 assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
//                 assert(ast.stylesheet.rules[0].declarations[0].value === 'green')
//                 assert(ast.stylesheet.rules[1].type === 'comment')
//                 assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy96YWcvcXV4LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGFBQWE7Q0FDZCIsImZpbGUiOiJxdXguY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmxvY2FsIC5jb2xvcmVkIHtcbiAgY29sb3I6IGdyZWVuO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
//                 }
//                 assert($('h1').text() === 'mod')
//                 assert($('li').eq(0).attr('class') === 'yw-QzTzn815548qkIxFLf')
//                 assert($('li').eq(1).attr('class') === '_18xqcZJ7ZRzog895KtSs9p')
//                 resolve()
//               })
//               .catch(reject)
//           })
//           .run()
//           .then(() => {
//             const $ = cheerio.load(beforeContent)
//             $('h1').text('mod')
//             return fs.writeFile(srcPath, $.html())
//           })
//           .catch(reject)
//       })
//         .catch(err => error = err)
//         .then(() => {
//           compiler.destruct()
//           if (error) return Promise.reject(error)
//         })
//     })
//
//     it('should remove a bundled html file when a source html file is removed', () => {
//       let error
//       let compiler = new CSSPack({
//         context: utils.fixtures,
//         entry: 'src/html/**/*.html',
//         output: 'dist',
//         outWriter: new Buffer(1000),
//         watch: true,
//       })
//       return new Promise((resolve, reject) => {
//         compiler
//           .on('unlink', (e) => {
//             if (e.rel !== 'modify_test.html') return
//             fs.stat(path.join(utils.fixtures, 'dist/modify_test.html'))
//               .then(() => reject("shouldn't exist"))
//               .catch(() => resolve())
//           })
//           .run()
//           .then(() => del([srcPath]))
//           .catch(reject)
//       })
//         .catch(err => error = err)
//         .then(() => {
//           compiler.destruct()
//           if (error) return Promise.reject(error)
//         })
//     })
//
//     it('should regenerate when the linked CSS is modified', () => {
//     })
//
//     it('should watch a new CSS when the URL of the CSS link is changed', () => {
//       let error
//       let compiler = new CSSPack({
//         context: utils.fixtures,
//         entry: 'src/html/**/*.html',
//         output: 'dist',
//         outWriter: new Buffer(1000),
//         watch: true,
//       })
//       return fs.readFile(path.join(utils.fixtures, 'src/css/baz.css'))
//         .then((content) => fs.writeFile(path.join(utils.fixtures, 'src/css/modify_test.css'), content))
//         .then(() => new Promise((resolve, reject) => {
//           // modify HTML: rewrite the href of a link
//           compiler
//             .on('change', (e) => {
//               if (e.rel !== 'modify_test.html') return
//               fs.readFile(path.join(utils.fixtures, 'dist/modify_test.html'))
//                 .then((content) => {
//                   const $ = cheerio.load(content)
//                   {
//                   const ast = css.parse($('style').eq(0).text())
//                   assert(ast.stylesheet.rules[0].type === 'rule')
//                   assert(ast.stylesheet.rules[0].selectors[0] === '._1pNiXyTXRCzfMdnoqqMcUi')
//                   assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
//                   assert(ast.stylesheet.rules[0].declarations[0].value === 'red')
//                   assert(ast.stylesheet.rules[1].type === 'comment')
//                   assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy9tb2RpZnlfdGVzdC5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRSxXQUFXO0NBQ1oiLCJmaWxlIjoibW9kaWZ5X3Rlc3QuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmxvY2FsIC5jb2xvcmVkIHtcbiAgY29sb3I6IHJlZDtcbn1cbiJdLCJzb3VyY2VSb290Ijoid2VicGFjazovLyJ9 ')
//                   }
//                   {
//                   const ast = css.parse($('style').eq(1).text())
//                   assert(ast.stylesheet.rules[0].type === 'rule')
//                   assert(ast.stylesheet.rules[0].selectors[0] === '._18xqcZJ7ZRzog895KtSs9p')
//                   assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
//                   assert(ast.stylesheet.rules[0].declarations[0].value === 'green')
//                   assert(ast.stylesheet.rules[1].type === 'comment')
//                   assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy96YWcvcXV4LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGFBQWE7Q0FDZCIsImZpbGUiOiJxdXguY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmxvY2FsIC5jb2xvcmVkIHtcbiAgY29sb3I6IGdyZWVuO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
//                   }
//                   assert($('h1').text() === 'foo')
//                   assert($('li').eq(0).attr('class') === '_1pNiXyTXRCzfMdnoqqMcUi')
//                   assert($('li').eq(1).attr('class') === '_18xqcZJ7ZRzog895KtSs9p')
//                   resolve()
//                 })
//                 .catch(reject)
//             })
//             .run()
//             .then(() => {
//               const $ = cheerio.load(beforeContent)
//               const $link = $('link[type="text/postcss"]').eq(0).attr('href', '../css/modify_test.css')
//               return fs.writeFile(srcPath, $.html())
//             })
//             .catch(reject)
//         }))
//         .then(() => compiler.removeAllListeners())
//         // .then(() => new Promise((resolve, reject) => {
//         //   // modify CSS: rewrite color
//         //   compiler
//         //     .on('change', (e) => {
//         //       if (e.rel !== 'modify_test.html') return
//         //       fs.readFile(path.join(utils.fixtures, 'dist/modify_test.html'))
//         //         .then((content) => {
//         //           const $ = cheerio.load(content)
//         //           {
//         //           const ast = css.parse($('style').eq(0).text())
//         //           assert(ast.stylesheet.rules[0].type === 'rule')
//         //           assert(ast.stylesheet.rules[0].selectors[0] === '._1pNiXyTXRCzfMdnoqqMcUi')
//         //           assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
//         //           assert(ast.stylesheet.rules[0].declarations[0].value === 'blue')
//         //           assert(ast.stylesheet.rules[1].type === 'comment')
//         //           assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy9tb2RpZnlfdGVzdC5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQSxZQUFZO0NBQ1giLCJmaWxlIjoibW9kaWZ5X3Rlc3QuY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmxvY2FsIC5jb2xvcmVkIHtcbmNvbG9yOiBibHVlO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
//         //           }
//         //           {
//         //           const ast = css.parse($('style').eq(1).text())
//         //           assert(ast.stylesheet.rules[0].type === 'rule')
//         //           assert(ast.stylesheet.rules[0].selectors[0] === '._18xqcZJ7ZRzog895KtSs9p')
//         //           assert(ast.stylesheet.rules[0].declarations[0].property === 'color')
//         //           assert(ast.stylesheet.rules[0].declarations[0].value === 'green')
//         //           assert(ast.stylesheet.rules[1].type === 'comment')
//         //           assert(ast.stylesheet.rules[1].comment === '# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi8uL3Rlc3QvZml4dHVyZXMvc3JjL2Nzcy96YWcvcXV4LmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFLGFBQWE7Q0FDZCIsImZpbGUiOiJxdXguY3NzIiwic291cmNlc0NvbnRlbnQiOlsiOmxvY2FsIC5jb2xvcmVkIHtcbiAgY29sb3I6IGdyZWVuO1xufVxuIl0sInNvdXJjZVJvb3QiOiJ3ZWJwYWNrOi8vIn0= ')
//         //           }
//         //           assert($('h1').text() === 'foo')
//         //           assert($('li').eq(0).attr('class') === '_1pNiXyTXRCzfMdnoqqMcUi')
//         //           assert($('li').eq(1).attr('class') === '_18xqcZJ7ZRzog895KtSs9p')
//         //           resolve()
//         //         })
//         //         .catch(reject)
//         //     })
//         //   fs.readFile(path.join(utils.fixtures, 'src/css/modify_test.css'))
//         //     .then((content) => {
//         //       const ast = css.parse(content)
//         //       ast.stylesheet.rules[0].declarations[0].value === 'blue'
//         //       return fs.writeFile(path.join(utils.fixtures, 'src/css/modify_test.css'), css.stringify(ast).code)
//         //     })
//         //     .catch(reject)
//         // }))
//         .catch(err => error = err)
//         .then(() => {
//           compiler.destruct()
//           if (error) return Promise.reject(error)
//         })
//     })
//   })
// })
})
