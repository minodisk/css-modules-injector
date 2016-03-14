const glob = require('glob')
const base = require('glob-base')

module.exports = (path, options) => {
  const b = (path == null) ? '' : base(path).base
  return new Promise((resolve, reject) => {
    glob(path, options, (err, paths) => {
      if (err) return reject(err)
      resolve(paths)
    })
  })
}
