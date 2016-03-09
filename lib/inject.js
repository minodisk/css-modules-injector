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
  const input = options.input
  const output = options.output
  const css = options.css

  return Promise
    .all([
      glob(input),
      glob(css)
    ])
    .then((arg) => {
      const inputs = arg[0]
      const csses = arg[1]
      if (inputs.length === 0) {
        throw new Error('no inputs')
      }
      return injectWithFiles(inputs, csses, output)
    })
}

const injectWithFiles = (inputs, csses, output) => {
  const cssFilenames = csses.map((cssFilename) => {
    const name = path.basename(cssFilename, path.extname(cssFilename))
    return {
      name: name,
      path: './' + cssFilename,
    }
  })

  fs
    .readFile(jsTemplateSourcePath, fsOptions)
    .then((jsTemplateSource) => {
    })
}

const bundle = (jsTemplateSource) => {
  const jsTemplate = ejs.compile(jsTemplateSource)
  const entries = []

  return Promise
    .all(
      inputs.map((htmlTemplateFilename) => {
        const name = path.basename(htmlTemplateFilename, path.extname(htmlTemplateFilename))
        const js = jsTemplate({
          cssFilenames: cssFilenames,
          styleTemplateFilename: styleTemplateSourcePath,
          htmlTemplateFilename: './' + htmlTemplateFilename,
          outputFilename: name + '.html',
        })

        const javaScriptOutputFile = '.' + name + '.js'
        entries.push('./' + javaScriptOutputFile)

        return fs.writeFile(javaScriptOutputFile, js, 'utf-8')
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
