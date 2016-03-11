const glob = require('./promise/glob')
const fs = require('./promise/fs')
const webpack = require('./promise/webpack')
const path = require('path')
const ejs = require('ejs')
const jsdom = require('jsdom')

const fsOptions = {
  encoding: 'utf8'
}
const jsTemplatePath = path.join(__dirname, 'template/injector.js.ejs')

const injectWithOptions = (options) => {
  const inputGlob = options.input
  const outputDir = options.output
  const cssGlob = options.css

  return Promise
    .all([
      glob(inputGlob),
      glob(cssGlob)
    ])
    .then((arg) => {
      const inputPaths = arg[0]
      const cssPaths = arg[1]
      if (inputPaths.length === 0) {
        throw new Error('no inputs')
      }
      return injectWithFiles(inputPaths, cssPaths, outputDir)
    })
}

const injectWithFiles = (sourcePaths, cssPaths, outputDir) => {
  const sources = sourcePaths.map((sourcePath) => {
    const name = path.basename(sourcePath, path.extname(sourcePath))
    return {
      name,
      path: sourcePath
    }
  })

  const cssObjs = cssPaths.map((cssPath) => {
    const name = path.basename(cssPath, path.extname(cssPath))
    return {
      name,
      path: './' + cssPath,
    }
  })

  return generateAttacherJS(cssObjs)
    .then(() => bundle())
    .then(() => render(sources))
    .then(() => cleanUp([attacherJS, bundleJS, bundleJSMap]))
}

const attacherJS = '.attacher.js'
const bundleJS = '.bundle.js'
const bundleJSMap = bundleJS + '.map'

const generateAttacherJS = (cssObjs) => {
  return fs
    .readFile(jsTemplatePath, fsOptions)
    .then((jsTemplateSource) => {
      const jsTemplate = ejs.compile(jsTemplateSource)
      const js = jsTemplate({
        cssObjs: cssObjs,
      })
      return fs.writeFile(attacherJS, js, fsOptions)
    })
}

const bundle = () => {
  return webpack({
    entry: './' + attacherJS,
    devtool: 'source-map',
    output: {
      path: '.',
      filename: bundleJS,
    },
    resolve: {
      extensions: [
        '',
        '.js',
        '.css',
        '.html',
      ]
    },
    module: {
      loaders: [
        {
          test: /\.css$/,
          loaders: [
            'style?sourceMap',
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

const render = (sources) => {
  return fs
    .readFile(bundleJS, fsOptions)
    .then((js) => {
      const virtualConsole = jsdom.createVirtualConsole()
      virtualConsole.on('log', (message) => {
        console.log(message)
      })
      virtualConsole.on('jsdomError', (err) => {
        console.error(err.stack, err.detail)
      })
      return Promise.all(
        sources.map((source) => {
          return fs.readFile(source.path, fsOptions)
            .then((html) => {
              return new Promise((resolve, reject) => {
                jsdom.env({
                  virtualConsole,
                  html,
                  src: [js],
                  done: (err, window) => {
                    if (err != null) return reject(err)
                    resolve(window.document.documentElement.outerHTML)
                  }
                })
              })
            })
            .then((renderedHTML) => {
              return fs.writeFile(source.name + '.html', renderedHTML, fsOptions)
            })
        })
      )
    })
    .catch((err) => console.error(err))
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
