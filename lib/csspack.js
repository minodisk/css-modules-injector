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
  return glob(entry)
    .then((entries) => {
      if (entries.length === 0) {
        return Promise.reject(new Error('no entry'))
      }
      return processFiles(base(entry).base, entries, output, logger)
    })
    .catch((err) => {
      if (errWriter) {
        logger.error(err)
        process.exit(1)
      }
      return Promise.reject(err)
    })
}

const processFiles = (base, entries, output, logger) => {
  return Promise.all(entries.map(entry => processFile(base, entry, output, logger)))
}

const processFile = (base, entry, output, logger) => {
  const attacherJSPath = path.join(path.dirname(entry), '.' + path.basename(entry, path.extname(entry)) + '.js')
  const bundledJSPath = attacherJSPath + '~'
  const outputHTMLPath = path.join(output, path.relative(base, entry))

  let htmlWithoutLinks
  let err

  const vcs = [
    new VirtualConsole(logger, 'processor'),
    new VirtualConsole(logger, 'attacher'),
  ]

  return parseHTML(entry, vcs[0].console)
    .then((result) => {
      htmlWithoutLinks = result.html
      return generateAttacherJS(result.cssSources, attacherJSPath)
    })
    .then(() => bundle(attacherJSPath, bundledJSPath))
    .then((message) => logger.log(message))
    .then(() => attach(htmlWithoutLinks, bundledJSPath, outputHTMLPath, vcs[1].console))
    .catch((e) => err = e)
    .then(() => del([attacherJSPath, bundledJSPath]))
    .then(() => {
      if (err) return Promise.reject(err)
    })
}

const parseHTML = (entry, virtualConsole) => {
  return new Promise((resolve, reject) => {
    jsdom.env({
      file: entry,
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
}
