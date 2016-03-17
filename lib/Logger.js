'use strict'

const colors = require('colors/safe')

class Logger {
  constructor (options) {
    this.log = this.log.bind(this)
    this.error = this.error.bind(this)

    const nowWriter = new NopWriter
    this.outWriter = options.silent ? nopWriter : options.outWriter ? options.outWriter : process.stdout
    this.errWriter = options.silent ? nopWriter : options.errWriter ? options.errWriter : process.stderr
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
