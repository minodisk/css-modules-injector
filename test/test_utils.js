const fs = require('../lib/promise/fs')
const path = require('path')

exports.fixturesPath = path.join(__dirname, '../test-fixtures')

exports.cleanUp = () => {
  const dist = path.join(__dirname, '../test-fixtures/dist')
  return fs.stat()
    .then(() => {
      return fs.unlink(dist)
    })
    .catch((err) => {
      // do nothing
    })
}
