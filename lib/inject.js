const glob = require('glob')
const getGlob = (path) => {
  return new Promise(function (resolve, reject) {
    glob(path, null, function (err, files) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(files)
    })
  })
}

module.exports = (options) => {
  const input = options.input
  const output = options.output
  const css = options.css

  return Promise
    .all([
      getGlob(input),
      getGlob(css)
    ])
    .then((arg) => {
      const inputs = arg[0]
      const csses = arg[1]
      if (inputs.length === 0) {
        throw new Error('no inputs')
      }
      return inject(inputs, csses, output)
    })
}

const webpack = require('webpack')
const path = require('path')
const ejs = require('ejs')
const fs = require('fs')

const inject = (inputs, csses, output) => {
  const cssFiles = csses.map((css) => {
    const name = path.basename(css, path.extname(css))
    return {
      name: name,
      path: './' + css,
    }
  })

  var jsTmpl = fs.readFileSync(path.join(__dirname, 'injector.js.ejs'), 'utf8')
  var tmpl = ejs.compile(jsTmpl)
  const entries = []

  inputs.forEach((htmlTemplateFile) => {
    const name = path.basename(htmlTemplateFile, path.extname(htmlTemplateFile))

    var js = tmpl({
      cssFiles: cssFiles,
      styleTemplateFile: path.join(__dirname, 'styles.ejs'),
      htmlTemplateFile: './' + htmlTemplateFile,
      outputFile: name + '.html',
    })

    const javaScriptOutputFile = name + '.js'
    fs.writeFileSync(javaScriptOutputFile, js, 'utf-8')
    entries.push('./' + javaScriptOutputFile)
  })

  webpack({
    entry: entries,
    devtool: 'source-map',
    output: {
      path: 'tmp',
      filename: '[name].js',
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
      (function () {
        var IGNORES = [
          'fs'
        ]
        return function (context, request, callback) {
          if (IGNORES.indexOf(request) >= 0) {
            return callback(null, "require('" + request + "')")
          }
          return callback()
        }
      })()
    ],
  }, (err, stat) => {
    if (err != null) {
      console.error(err)
      return
    }
    console.log(stat.toString())
  })
}
