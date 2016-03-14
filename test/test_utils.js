const fs = require('../lib/promise/fs')
const path = require('path')

const fixtures = path.join(__dirname, 'fixtures')

const cleanUp = () => {
  return fs.stat()
    .then(() => {
      return fs.unlink(path.join(fixtures, 'dist'))
    })
    .catch((err) => {
      // do nothing
    })
}

module.exports = {
  fixtures,
  cleanUp,
}
