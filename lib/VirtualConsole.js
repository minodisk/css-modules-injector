'use strict'

const jsdom = require('jsdom')
const colors = require('colors')

class VirtualConsole {
  constructor (logger, id) {
    this.onLog = this.onLog.bind(this)
    this.onError = this.onError.bind(this)

    this.logger = logger
    this.id = id
    this.console = jsdom.createVirtualConsole()
      .on('log', this.onLog)
      .on('jsdomError', this.onError)
  }

  onLog (message) {
    this.logger.log(`VirtualConsole: ${this.id}`)
    this.logger.log('-'.repeat(80))
    this.logger.log(message)
    this.logger.log('-'.repeat(80))
  }

  onError (err) {
    this.logger.error(`VirtualConsole: ${this.id}`)
    this.logger.error('-'.repeat(80))
    this.logger.error(colors.red(err.stack))
    this.logger.error('-'.repeat(80))
  }
}

module.exports = VirtualConsole
