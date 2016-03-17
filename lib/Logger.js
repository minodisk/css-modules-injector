'use strict'

const colors = require('colors/safe')

class Logger {
  constructor (outWriter, errWriter, options) {
    this.log = this.log.bind(this)
    this.error = this.error.bind(this)

    const n = new NopWriter()
    this.outWriter = outWriter || n
    this.errWriter = errWriter || n
    if (options.colors) {
      const error = this.error
      this.error = (message) => error(colors.red(message))
    }
  }

  log (message) {
    this.outWriter.write(message + '\n')
  }

  error (message) {
    this.errWriter.write(message + '\n')
  }
}

class NopWriter {
  write () {}
}

module.exports = Logger
