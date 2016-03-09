const glob = require('glob')

module.exports = (path, options) => {
  return new Promise((resolve, reject) => {
    glob(path, options, (err, paths) => {
      if (err) return reject(err)
      resolve(paths)
    })
  })
}
