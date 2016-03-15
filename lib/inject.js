const glob = require('./promise/glob')
const fs = require('./promise/fs')
const webpack = require('./promise/webpack')
const path = require('path')
const ejs = require('ejs')
const jsdom = require('jsdom')
const base = require('glob-base')
const pretty = require('pretty')
const del = require('del')
const colors = require('colors/safe')

const map = Array.prototype.map
const jsTemplatePath = path.join(__dirname, 'template/attacher.js')

const createVirtualConsole = (id) => {
  return jsdom.createVirtualConsole()
    .on('log', (message) => {
      console.log(`[${id} Log]`, colors.blue(message))
    })
    .on('jsdomError', (err) => {
      console.error(`[${id} Error]`, colors.red(err.stack))
    })
}

const injectWithOptions = (cwd, options) => {
  return injectWithBlobs(cwd, options.input, options.output)
}

const injectWithBlobs = (cwd, input, outputDir) => {
  const inputGlob = path.join(cwd, input)
  const basePath = base(inputGlob).base
  const outputPath = path.join(cwd, outputDir)
  return glob(inputGlob)
    .then((sourcePaths) => {
      if (sourcePaths.length === 0) {
        throw new Error('no inputs')
      }
      return processFiles(basePath, sourcePaths, outputPath)
    })
}

const processFiles = (basePath, sourcePaths, outputPath) => {
  return Promise.all(sourcePaths.map((sourcePath) => processFile(basePath, sourcePath, outputPath)))
}

const processFile = (basePath, sourcePath, outputPath) => {
  const attacherJSPath = path.join(path.dirname(sourcePath), '.' + path.basename(sourcePath, path.extname(sourcePath)) + '.js')
  const bundledJSPath = attacherJSPath + '~'
  const outputHTMLPath = path.join(outputPath, path.relative(basePath, sourcePath))

  var html

  return fs.readFile(sourcePath)
    .then((source) => {
      return new Promise((resolve, reject) => {
        jsdom.env({
          file: sourcePath,
          virtualConsole: createVirtualConsole('processor'),
          done: (err, window) => {
            if (err) return reject(err)
            const cssSources = map.call(window.document.querySelectorAll('link[type="text/postcss"]'), (link) => {
              const ns = link.getAttribute('id')
              const path = link.getAttribute('href')
              link.parentNode.removeChild(link)
              return {ns, path}
            })
            html = jsdom.serializeDocument(window.document)
            resolve(cssSources)
          }
        })
      })
    })
    .then((cssSources) => generateAttacherJS(cssSources, attacherJSPath))
    .then(() => bundle(attacherJSPath, bundledJSPath))
    .then(() => attach(html, bundledJSPath, outputHTMLPath))
    .then(() => del([attacherJSPath, bundledJSPath]))
}

const generateAttacherJS = (cssSources, attacherJSPath) => {
  return fs
    .readFile(jsTemplatePath)
    .then((jsTemplateSource) => ejs.render(jsTemplateSource, {cssSources}))
    .then((js) => fs.writeFile(attacherJSPath, js))
}

const bundle = (attacherJSPath, bundledJSPath) => {
  return webpack({
    entry: attacherJSPath,
    devtool: 'source-map',
    output: {
      path: path.dirname(bundledJSPath),
      filename: path.basename(bundledJSPath),
    },
    resolve: {
      extensions: [
        '',
        '.js',
        '.css',
      ]
    },
    module: {
      loaders: [
        {
          test: /\.css$/,
          loaders: [
            'style',
            'css?sourceMap',
          ]
        },
      ]
    },
  })
    .then((stat) => {
      console.log(stat.toString())
    })
}

const attach = (html, bundledJSPath, outputHTMLPath) => {
  return fs.readFile(bundledJSPath)
    .then((js) => {
      return new Promise((resolve, reject) => {
        jsdom.env(html, {
          virtualConsole: createVirtualConsole('attacher'),
          src: js,
          done: (err, window) => {
            if (err != null) return reject(err)
            resolve(pretty(jsdom.serializeDocument(window.document)))
          }
        })
      })
    })
    .then((renderedHTML) => fs.writeFile(outputHTMLPath, renderedHTML))
}

module.exports = {
  injectWithOptions,
  injectWithBlobs,
  processFiles,
}
