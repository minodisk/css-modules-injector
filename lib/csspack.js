'use strict'

const path = require('path')

const cheerio = require('cheerio')
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
        if (!this.options.watch) return
        return new Promise((resolve, reject) => {
          this.watcher = chokidar.watch(entry, {
            ignored: /[\/\\]\./,
            persistent: true,
          })
          const ready = () => {
            this.watcher.removeListener('ready', ready)
            this.watcher
              .on('add', this.onAdd)
              .on('change', this.onChange)
              .on('unlink', this.onUnlink)
            // .on('all', (event, path) => console.log(event, path))
            resolve()
          }
          this.watcher.on('ready', ready)
        })
      })
      .catch((err) => {
        this.logger.error(err)
        this.emit('error', err)
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
    console.log('add:', path)
    this.processFile(path, 'add')
  }

  onChange (path) {
    // console.log('change:', path)
    this.processFile(path, 'change')
  }

  onUnlink (path) {
    // console.log('unlink:', path)
    this.unlink(path)
  }

  unlink (entry) {
    // console.log('delete:', this.getOutputHTMLPath(entry).abs)
    const e = this.getOutputHTMLPath(entry)
    del([e.abs])
      .then(() => this.emit('unlink', e))
  }

  getOutputHTMLPath (entry) {
    const rel = path.relative(this.base, entry)
    const abs = path.join(this.output, rel)
    return {abs, rel}
  }

  processFiles (entries) {
    return Promise.all(entries.map(entry => this.processFile(entry, 'first')))
  }

  processFile (entry, event) {
    const name = path.join(path.dirname(entry), path.basename(entry, path.extname(entry)))
    const attacherJSPath = name + '.attacher.csspack'
    const bundledJSPath = name + '.bundler.csspack'
    const outputHTMLPath = this.getOutputHTMLPath(entry)

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
      .then(() => this.attach(htmlWithoutLinks, bundledJSPath, outputHTMLPath.abs, vcs[1].console))
      .catch((e) => err = e)
      .then(() => del([attacherJSPath, bundledJSPath]))
      .then(() => {
        this.emit(event, outputHTMLPath)
        if (err) return Promise.reject(err)
      })
  }

  parseHTML (entry, virtualConsole) {
    return fs.readFile(entry)
      .then((html) => {
        return new Promise((resolve, reject) => {
          const $ = cheerio.load(html)
          const cssSources = map.call($('link[type="text/postcss"]'), (link) => {
            const $link = $(link)
            const ns = $link.attr('id')
            let cssPath = $link.attr('href')
            if (!path.isAbsolute(cssPath)) {
              cssPath = path.join(path.dirname(entry), cssPath)
            }
            $link.remove()
            return {ns, path: cssPath}
          })
          resolve({html: $.html(), cssSources})
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
      // devtool: 'source-map',
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
              'css',
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
