const webpack = require('webpack')

module.exports = (options) => {
  return new Promise((resolve, reject) => {
    webpack(options, (err, stat) => {
      if (err) return reject(err)
      resolve(stat)
    })
  })
}
