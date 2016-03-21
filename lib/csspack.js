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
    this.onAdd = this.onAdd.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onUnlink = this.onUnlink.bind(this)
    this.options = options
    this.logger = new Logger(options)
  }

  destruct () {
    this.stopWatch()
  }

  run () {
    const entry = path.join(this.options.context, this.options.entry)
    this.output = path.join(this.options.context, this.options.output)
    this.base = base(entry).base

    return glob(entry)
      .then((entries) => {
        if (entries.length === 0) {
          return Promise.reject(new Error('no entry'))
        }
        return this.processFiles(entries)
      })
      .then(() => {
        if (this.options.watch) {
          this.watcher = chokidar.watch(entry, {
            ignored: /[\/\\]\./,
            persistent: true,
          })
          this.watcher
            .on('add', this.onAdd)
            .on('change', this.onChange)
            .on('unlink', this.onUnlink)
        }
      })
      .catch((err) => {
        this.logger.error(err)
        if (!this.options.watch) {
          process.exit(1)
        }
        return Promise.reject(err)
      })
  }

  stopWatch () {
    if (this.watcher == null) return
    this.watcher.removeAllListeners()
    this.watcher.close()
    delete this.watcher
  }

  // on (event, listener) {
  //   super.on(event, listener)
  //   return this
  // }

  onAdd (path) {
    // console.log('add:', path)
    this.processFile(path, 'add')
  }

  onChange (path) {
    // console.log('change:', path)
    this.processFile(path, 'change')
  }

  onUnlink (path) {}

  processFiles (entries) {
    return Promise.all(entries.map(entry => this.processFile(entry, 'first')))
  }

  processFile (entry, event) {
    const attacherJSPath = path.join(path.dirname(entry), '.' + path.basename(entry, path.extname(entry)) + '.js')
    // const attacherJSPath = path.join(tmp, '.' + path.basename(entry, path.extname(entry)) + '.js')
    const bundledJSPath = attacherJSPath + '~'
    const outputHTMLRel = path.relative(this.base, entry)
    const outputHTMLPath = path.join(this.output, outputHTMLRel)

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
        this.emit(event, {
          abs: outputHTMLPath,
          rel: outputHTMLRel,
        })
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
            let p = link.getAttribute('href')
            if (!path.isAbsolute(p)) {
              p = path.join(path.dirname(entry), p)
            }
            link.parentNode.removeChild(link)
            return {ns, path: p}
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
