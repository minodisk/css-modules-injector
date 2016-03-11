const glob = require('../lib/promise/glob')
const path = require('path')

exports.cleanUp = () => {
  return glob(path.join(__dirname, 'fixtures/dist/**/*.html'))
    .then((g) => {
      return Promise.all(
        g.paths.map((path) => fs.unlink(path))
      )
    })
}
