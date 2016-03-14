// Promise based fs

const fs = require('fs')
const defaultOptions = { encoding: 'utf8' }
const mkdirp = require('mkdirp')

exports.stat = (entry) => {
  return new Promise((resolve, reject) => {
    fs.stat(entry, (err, stats) => {
      if (err) return reject(err)
      resolve(stats)
    })
  })
}

exports.unlink = (entry) => {
  return new Promise((resolve, reject) => {
    fs.unlink(entry, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

exports.readFile = (file, options, callback) => {
  const o = Object.assign({}, defaultOptions, options)
  return new Promise((resolve, reject) => {
    fs.readFile(file, o, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

exports.writeFile = (file, data, options) => {
  const o = Object.assign({}, defaultOptions, options)
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, o, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

exports.unlink = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

exports.mkdirp = (path) => {
  return new Promise((resolve, reject) => {
    mkdirp(path, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
