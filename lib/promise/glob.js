// const glob = require('glob')
const globby = require('globby')
const base = require('glob-base')

module.exports = (path, options) => {
  const b = (path == null) ? '' : base(path).base
  console.log(base(path))
  return globby(path, options)
    .then((paths) => {
      return {base: b, paths}
    })
}
