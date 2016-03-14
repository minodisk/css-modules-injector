const glob = require('./promise/glob')
const fs = require('./promise/fs')
const webpack = require('./promise/webpack')
const path = require('path')
const ejs = require('ejs')
const jsdom = require('jsdom')
const base = require('glob-base')
const pretty = require('pretty')

const forEach = Array.prototype.forEach
const map = Array.prototype.map
const fsOptions = { encoding: 'utf8' }
const jsTemplatePath = path.join(__dirname, 'template/attacher.js')

const virtualConsole = (() => {
  return jsdom.createVirtualConsole()
    .on('log', (message) => {
      console.log(message)
    })
    .on('jsdomError', (err) => {
      console.error(err.stack, err.detail)
    })
})()

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
      return injectWithFiles(basePath, sourcePaths, outputPath)
    })
}

const injectWithFiles = (basePath, sourcePaths, outputPath) => {
  return Promise.all(sourcePaths.map((sourcePath) => process(basePath, sourcePath, outputPath)))
}

const process = (basePath, sourcePath, outputPath) => {
  const attacherJSPath = path.join(path.dirname(sourcePath), '.' + path.basename(sourcePath, path.extname(sourcePath)) + '.js')
  const bundledJSPath = attacherJSPath + '~'
  const outputHTMLPath = path.join(outputPath, path.relative(basePath, sourcePath))

  var html

  return fs.readFile(sourcePath)
    .then((source) => {
      const doc = jsdom.jsdom(source, { virtualConsole})
      const cssSources = map.call(doc.querySelectorAll('link[type="text/postcss"]'), (link) => {
        const ns = link.getAttribute('id')
        const path = link.getAttribute('href')
        link.parentNode.removeChild(link)
        return {ns, path}
      })
      html = jsdom.serializeDocument(doc)
      return generateAttacherJS(cssSources, attacherJSPath)
    })
    .then(() => bundle(attacherJSPath, bundledJSPath))
    .then(() => attach(html, bundledJSPath, outputHTMLPath))
}

const generateAttacherJS = (cssSources, attacherJSPath) => {
  return fs
    .readFile(jsTemplatePath, fsOptions)
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
        const doc = jsdom.env(html, {
          virtualConsole,
          src: js,
          done: (err, window) => {
            if (err != null) return reject(err)
            resolve(pretty(jsdom.serializeDocument(window.document)))
          }
        })
      })
    })
    .then((renderedHTML) => {
      return fs.mkdirp(path.dirname(outputHTMLPath))
        .then(() => fs.writeFile(outputHTMLPath, renderedHTML))
    })
}

// const cleanUp = (paths) => {
//   return Promise.all(
//     paths.map((path) => {
//       return fs
//         .stat(path)
//         .then(stats => fs.unlink(path))
//     })
//   )
// }

module.exports = {
  injectWithOptions,
  injectWithBlobs,
  injectWithFiles,
}
