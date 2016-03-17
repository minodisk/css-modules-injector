'use strict'

const path = require('path')

const chokidar = require('chokidar')
const ejs = require('ejs')
const EventEmitter = require('eventemitter3')
const del = require('del')
const base = require('glob-base')
const jsdom = require('jsdom')
const pretty = require('pretty')

const cli = require('./cli')
const VirtualConsole = require('./VirtualConsole')
const Logger = require('./Logger')
const glob = require('./promise/glob')
const fs = require('./promise/fs')
const webpack = require('./promise/webpack')

const join = Array.prototype.join
const map = Array.prototype.map
const jsTemplatePath = path.join(__dirname, 'template/attacher.js')

class CSSPack extends EventEmitter {

  constructor (options) {
    super()
    this.options = options
    this.logger = new Logger(options)
  }

  run () {
    const entry = path.join(this.options.context, this.options.entry)
    const output = path.join(this.options.context, this.options.output)

    if (this.options.watch) {
      const watcher = chokidar.watch(entry, {
        ignored: /[\/\\]\./,
        persistent: true,
      })
      this.watcher
        .on('add', onChange)
        .on('change', onChange)
        .on('unlink', onUnlink)
    }

    return glob(entry)
      .then((entries) => {
        if (entries.length === 0) {
          return Promise.reject(new Error('no entry'))
        }
        return this.processFiles(base(entry).base, entries, output)
      })
      .catch((err) => {
        this.logger.error(err)
        if (!this.options.watch) {
          process.exit(1)
        }
        return Promise.reject(err)
      })
  }

  onChange (path) {
    console.log('onChange:', path)
  }

  onUnlink (path) {
    console.log('onUnlink:', path)
  }

  processFiles (base, entries, output) {
    return Promise.all(entries.map(entry => this.processFile(base, entry, output)))
  }

  processFile (base, entry, output) {
    const attacherJSPath = path.join(path.dirname(entry), '.' + path.basename(entry, path.extname(entry)) + '.js')
    const bundledJSPath = attacherJSPath + '~'
    const outputHTMLPath = path.join(output, path.relative(base, entry))

    let htmlWithoutLinks
    let err

    const vcs = [
      new VirtualConsole(this.logger, 'processor'),
      new VirtualConsole(this.logger, 'attacher'),
    ]

    return this.parseHTML(entry, vcs[0].console)
      .then((result) => {
        htmlWithoutLinks = result.html
        return this.generateAttacherJS(result.cssSources, attacherJSPath)
      })
      .then(() => this.bundle(attacherJSPath, bundledJSPath))
      .then((message) => this.logger.log(message))
      .then(() => this.attach(htmlWithoutLinks, bundledJSPath, outputHTMLPath, vcs[1].console))
      .catch((e) => err = e)
      .then(() => del([attacherJSPath, bundledJSPath]))
      .then(() => {
        if (err) return Promise.reject(err)
      })
  }

  parseHTML (entry, virtualConsole) {
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

  generateAttacherJS (cssSources, attacherJSPath) {
    return fs
      .readFile(jsTemplatePath)
      .then((jsTemplateSource) => ejs.render(jsTemplateSource, {cssSources}))
      .then((js) => fs.writeFile(attacherJSPath, js))
  }

  bundle (attacherJSPath, bundledJSPath) {
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

  attach (html, bundledJSPath, outputHTMLPath, virtualConsole) {
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
}

const csspack = (options) => {
  const c = new CSSPack(options)
  return c.run()
    .then(() => c)
}
csspack.CSSPack = CSSPack

module.exports = csspack
