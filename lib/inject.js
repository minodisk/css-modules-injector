const glob = require('./promise/glob')
const fs = require('./promise/fs')
const webpack = require('./promise/webpack')
const path = require('path')
const ejs = require('ejs')
const jsdom = require('jsdom')

const forEach = Array.prototype.forEach
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
  return glob(input)
    .then((sourceGlob) => {
      if (sourceGlob.length === 0) {
        throw new Error('no inputs')
      }
      return injectWithFiles(cwd, sourceGlob, outputDir)
    })
}

const injectWithFiles = (cwd, sourceGlob, outputDir) => {
  console.log(sourceGlob)
  const sources = sourceGlob.paths.map((sourcePath) => {
    const name = path.basename(sourcePath, path.extname(sourcePath))
    return {
      name,
      path: sourcePath
    }
  })

  return Promise.all(sources.map(process))
}

const process = (source) => {
  const attacherJSPath = path.join(path.dirname(source.path), '.' + path.basename(source.path, path.extname(source.path)) + '.js')
  return new Promise((resolve, reject) => {
    jsdom.env({
      virtualConsole,
      file: source.path,
      done: (err, window) => {
        if (err != null) return reject(err)
        const cssSources = []
        forEach.call(window.document.querySelectorAll('link[type="text/postcss"]'), (link) => {
          const ns = link.getAttribute('id')
          const path = link.getAttribute('href')
          cssSources.push({ns, path})
        })
        resolve(cssSources)
      }
    })
  })
    .then((cssSources) => generateAttacherJS(cssSources, attacherJSPath))
    .then(() => bundle(attacherJSPath))
    .then((bundledAttacherJSPath) => attach(source, bundledAttacherJSPath))
}

const generateAttacherJS = (cssSources, attacherJSPath) => {
  return fs
    .readFile(jsTemplatePath, fsOptions)
    .then((jsTemplateSource) => ejs.render(jsTemplateSource, {cssSources}))
    .then((js) => fs.writeFile(attacherJSPath, js, fsOptions))
}

const bundle = (attacherJSPath) => {
  const bundledAttacherJSPath = path.basename(attacherJSPath) + '~'
  return webpack({
    entry: './' + attacherJSPath,
    devtool: 'source-map',
    output: {
      path: path.dirname(attacherJSPath),
      filename: bundledAttacherJSPath,
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
      return bundledAttacherJSPath
    })
}

const attach = (source, jsPath) => {
  return new Promise((resolve, reject) => {
    jsdom.env({
      virtualConsole,
      file: source.path,
      scripts: [jsPath],
      done: (err, window) => {
        if (err != null) return reject(err)
        resolve(window.document.documentElement.outerHTML)
      }
    })
  })
    .then((renderedHTML) => {
      console.log(source)
    // return fs.writeFile(source.name + '.html', renderedHTML, fsOptions)
    })
}

const cleanUp = (paths) => {
  return Promise.all(
    paths.map((path) => {
      return fs
        .stat(path)
        .then(stats => fs.unlink(path))
    })
  )
}

module.exports = {
  injectWithOptions,
  injectWithFiles,
}
