// Promise based graceful fs

const fs = require('fs')
const path = require('path')
const defaultOptions = { encoding: 'utf8' }
const mkdirRecursively = require('mkdirp')

const mkdirp = (path) => {
  return new Promise((resolve, reject) => {
    mkdirRecursively(path, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

const readFile = (file, options, callback) => {
  const o = Object.assign({}, defaultOptions, options)
  return new Promise((resolve, reject) => {
    fs.readFile(file, o, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

const writeFile = (file, data, options) => {
  return mkdirp(path.dirname(file))
    .then(() => {
      const o = Object.assign({}, defaultOptions, options)
      return new Promise((resolve, reject) => {
        fs.writeFile(file, data, o, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
}

const appendFile = (file, data, options) => {
  const o = Object.assign({}, defaultOptions, options)
  return new Promise((resolve, reject) => {
    fs.appendFile(file, data, o, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

module.exports = {
  readFile,
  writeFile,
  appendFile,
}
