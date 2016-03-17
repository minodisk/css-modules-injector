'use strict'

const glob = require('./promise/glob')
const fs = require('./promise/fs')
const webpack = require('./promise/webpack')
const path = require('path')
const ejs = require('ejs')
const jsdom = require('jsdom')
const base = require('glob-base')
const pretty = require('pretty')
const del = require('del')
const cli = require('../lib/cli')
const VirtualConsole = require('./VirtualConsole')
const Logger = require('./Logger')

const join = Array.prototype.join
const map = Array.prototype.map
const jsTemplatePath = path.join(__dirname, 'template/attacher.js')

const csspack = (options, outWriter, errWriter) => {
  const entry = path.join(options.context, options.entry)
  const output = path.join(options.context, options.output)
  const logger = new Logger(outWriter, errWriter, options)
  const p = glob(entry)
    .then((entries) => {
      if (entries.length === 0) {
        throw new Error('no inputs')
      }
      return processFiles(base(entry).base, entries, output, logger)
    })
  if (errWriter) {
    p.catch((err) => {
      logger.error(err)
      process.exit(1)
    })
  }
  return p
}

const injectWithArgv = (cwd, argv, outWriter) => {
  const options = cli.parse(argv)
  return inject(cwd, options.input, options.output, outWriter)
}

const processFiles = (baseAbsDir, inputAbsPaths, outputAbsDir, logger) => {
  return Promise.all(inputAbsPaths.map((inputAbsPath) => {
    const inputRelPath = path.relative(baseAbsDir, inputAbsPath)
    const outputAbsPath = path.join(outputAbsDir, inputRelPath)
    return processFile(inputAbsPath, outputAbsPath, logger)
  }))
}

const processFile = (inputAbsPath, outputAbsPath, logger) => {
  const attacherJSPath = path.join(path.dirname(inputAbsPath), '.' + path.basename(inputAbsPath, path.extname(inputAbsPath)) + '.js')
  const bundledJSPath = attacherJSPath + '~'

  let htmlWithoutLinks

  const vcs = [
    new VirtualConsole(logger, 'processor'),
    new VirtualConsole(logger, 'attacher'),
  ]

  return parseHTML(inputAbsPath, vcs[0].console)
    .then((result) => {
      htmlWithoutLinks = result.html
      return generateAttacherJS(result.cssSources, attacherJSPath)
    })
    .then(() => bundle(attacherJSPath, bundledJSPath))
    .then((message) => logger.log(message))
    .then(() => attach(htmlWithoutLinks, bundledJSPath, outputAbsPath, vcs[1].console))
    .then(() => del([attacherJSPath, bundledJSPath]))
}

const parseHTML = (inputAbsPath, virtualConsole) => {
  return new Promise((resolve, reject) => {
    jsdom.env({
      file: inputAbsPath,
      virtualConsole,
      done: (err, window) => {
        if (err) return reject(err)
        const cssSources = map.call(window.document.querySelectorAll('link[type="text/postcss"]'), (link) => {
          const ns = link.getAttribute('id')
          const path = link.getAttribute('href')
          link.parentNode.removeChild(link)
          return {ns, path}
        })
        const html = jsdom.serializeDocument(window.document)
        resolve({html, cssSources})
      }
    })
  })
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
    .then((stats) => stats.toString({colors: true}))
}

const attach = (html, bundledJSPath, outputHTMLPath, virtualConsole) => {
  return fs.readFile(bundledJSPath)
    .then((js) => {
      return new Promise((resolve, reject) => {
        jsdom.env({
          html,
          virtualConsole,
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
  csspack,
  injectWithArgv,
  processFiles,
}
