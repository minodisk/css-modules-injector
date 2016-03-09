// Promise based fs

const fs = require('fs')

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
  return new Promise((resolve, reject) => {
    fs.readFile(file, options, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

exports.writeFile = (file, data, options) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, options, (err) => {
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
