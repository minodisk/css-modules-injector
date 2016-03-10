const glob = require('./promise/glob')
const fs = require('./promise/fs')
const webpack = require('./promise/webpack')
const path = require('path')
const ejs = require('ejs')
const jsdom = require('jsdom')

const fsOptions = {
  encoding: 'utf8'
}
const jsTemplatePath = path.join(__dirname, 'template/injector.js.ejs')

const injectWithOptions = (options) => {
  const inputGlob = options.input
  const outputDir = options.output
  const cssGlob = options.css

  return Promise
    .all([
      glob(inputGlob),
      glob(cssGlob)
    ])
    .then((arg) => {
      const inputPaths = arg[0]
      const cssPaths = arg[1]
      if (inputPaths.length === 0) {
        throw new Error('no inputs')
      }
      return injectWithFiles(inputPaths, cssPaths, outputDir)
    })
}

const injectWithFiles = (inputsPaths, cssPaths, outputDir) => {
  const cssObjs = cssPaths.map((cssPath) => {
    const name = path.basename(cssPath, path.extname(cssPath))
    return {
      name: name,
      path: './' + cssPath,
    }
  })

  return fs
    .readFile(jsTemplatePath, fsOptions)
    .then((jsTemplateSource) => bundle(inputsPaths, jsTemplateSource, cssObjs))
}

const bundle = (htmlTemplatePaths, jsTemplateSource, cssObjs) => {
  const entries = []
  const jsTemplate = ejs.compile(jsTemplateSource)

  return Promise.all(
    htmlTemplatePaths.map((htmlTemplatePath) => {
      const name = path.basename(htmlTemplatePath, path.extname(htmlTemplatePath))
      const js = jsTemplate({
        cssObjs: cssObjs,
      })
      const jsOutputPath = '.' + name + '.js'
      entries.push('./' + jsOutputPath)
      return fs.writeFile(jsOutputPath, js, fsOptions)
    })
  )
    .then(() => {
      const options = {
        entry: entries,
        devtool: 'source-map',
        output: {
          path: '.',
          filename: '.[name].js',
        },
        resolve: {
          extensions: [
            '',
            '.js',
            '.css',
            '.html',
          ]
        },
        module: {
          loaders: [
            {
              test: /\.css$/,
              loaders: [
                'style?sourceMap',
                'css?sourceMap',
              ]
            },
          ]
        },
        externals: [
          (() => {
            const IGNORES = [
              'fs'
            ]
            return (context, request, callback) => {
              if (IGNORES.indexOf(request) >= 0) {
                return callback(null, "require('" + request + "')")
              }
              return callback()
            }
          })()
        ],
      }
      return webpack(options)
    })
    .then((stat) => {
      return fs
        .readFile('.main.js', fsOptions)
        .then((js) => {
          const virtualConsole = jsdom.createVirtualConsole()
          virtualConsole.on('log', (message) => {
            console.log(message)
          })
          virtualConsole.on('jsdomError', (err) => {
            console.error(err.stack, err.detail)
          })
          return Promise.all(
            htmlTemplatePaths.map((htmlTemplatePath) => {
              return fs.readFile(htmlTemplatePath, fsOptions)
                .then((htmlTemplateSource) => {
                  return new Promise((resolve, reject) => {
                    jsdom.env({
                      html: htmlTemplateSource,
                      src: [js],
                      virtualConsole: virtualConsole,
                      done: (err, window) => {
                        if (err != null) return reject(err)
                        resolve(window.document.documentElement.outerHTML)
                      }
                    })
                  })
                })
            })
          )
        })
        .then((html) => console.log(html))
        // .then(() => cleanUp(entries))
        .then(() => {
          console.log(stat.toString())
        })
    })
}

const cleanUp = (entries) => {
  return Promise
    .all(
      entries.map((entry) => {
        return fs
          .stat(entry)
          .then(stats => fs.unlink(entry))
      })
  )
}

module.exports = {
  injectWithOptions,
  injectWithFiles,
}
