// Promise based graceful fs

const fs = require('fs')
const path = require('path')
const defaultOptions = { encoding: 'utf8' }
const mkdirRecursively = require('mkdirp')

const stat = (path) => new Promise((resolve, reject) => {
  fs.stat(path, (err, stats) => {
    if (err) return reject(err)
    resolve(stats)
  })
})

const mkdirp = (path) => new Promise((resolve, reject) => {
  mkdirRecursively(path, (err) => {
    if (err) return reject(err)
    resolve()
  })
})

const readFile = (file, options, callback) => new Promise((resolve, reject) => {
  fs.readFile(file, Object.assign({}, defaultOptions, options), (err, data) => {
    if (err) return reject(err)
    resolve(data)
  })
})

const writeFile = (file, data, options) => mkdirp(path.dirname(file))
  .then(() => new Promise((resolve, reject) => {
    fs.writeFile(file, data, Object.assign({}, defaultOptions, options), (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
)

const appendFile = (file, data, options) => new Promise((resolve, reject) => {
  fs.appendFile(file, data, Object.assign({}, defaultOptions, options), (err) => {
    if (err) return reject(err)
    resolve()
  })
})

module.exports = {
  stat,
  readFile,
  writeFile,
  appendFile,
}
