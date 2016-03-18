const fs = require('../lib/promise/fs')
const path = require('path')
const del = require('del')

const fixtures = path.join(__dirname, 'fixtures')

const cleanUp = () => {
  return del([
    path.join(fixtures, 'dist'),
    path.join(fixtures, 'src/**/*_test.*'),
  ])
}

module.exports = {
  fixtures,
  cleanUp,
}
