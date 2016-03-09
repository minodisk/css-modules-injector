const glob = require('./promise/glob')
const fs = require('./promise/fs')
const webpack = require('./promise/webpack')
const path = require('path')
const ejs = require('ejs')

const fsOptions = {
  encoding: 'utf8'
}
const jsTemplateSourcePath = path.join(__dirname, 'injector.js.ejs')
const styleTemplateSourcePath = path.join(__dirname, 'styles.ejs')

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
    .readFile(jsTemplateSourcePath, fsOptions)
    .then((jsTemplateSource) => bundle(inputsPaths, jsTemplateSource, cssObjs))
}

const bundle = (htmlTemplatePaths, jsTemplateSource, cssObjs) => {
  const entries = []
  const jsTemplate = ejs.compile(jsTemplateSource)

  return Promise
    .all(
      htmlTemplatePaths.map((htmlTemplatePath) => {
        const name = path.basename(htmlTemplatePath, path.extname(htmlTemplatePath))
        const js = jsTemplate({
          cssObjs: cssObjs,
          styleTemplatePath: styleTemplateSourcePath,
          htmlTemplatePath: './' + htmlTemplatePath,
          outputPath: name + '.html',
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
            '.html'
          ]
        },
        module: {
          loaders: [
            {
              test: /\.ejs/,
              loaders: [
                'ejs',
              ]
            },
            {
              test: /\.jade/,
              loaders: [
                'jade',
              ]
            },
            {
              test: /\.css$/,
              loaders: [
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
      return cleanUp(entries)
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
