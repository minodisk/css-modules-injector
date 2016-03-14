const fs = require('../lib/promise/fs')
const path = require('path')
const del = require('del')

const fixtures = path.join(__dirname, 'fixtures')

const cleanUp = () => del(path.join(fixtures, 'dist'))

module.exports = {
  fixtures,
  cleanUp,
}
