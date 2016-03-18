const path = require('path')
const MemoryFS = require('memory-fs')
const fs = new MemoryFS()
const encoding = 'utf8'

const readFile = (file, options, callback) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, encoding, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

const writeFile = (file, data, options) => {
  return new Promise((resolve, reject) => {
    fs.mkdirp(path.dirname(file), (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
    .then(() => {
      return new Promise((resolve, reject) => {
        fs.writeFile(file, data, encoding, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
}

module.exports = {
  fs,
  readFile,
  writeFile,
}
