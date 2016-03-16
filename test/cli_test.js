const assert = require('power-assert')
const parse = require('../lib/cli').parse
const path = require('path')

describe('cli', () => {

  describe('parse', () => {

    describe('with no args and no config', () => {
      it('should be filled with default value', () => {
        const options = parse([])
        assert(options.context === process.cwd())
        assert(options.entry === '**/*.html')
        assert(options.output === 'dist')
        assert(options.config === 'csspack.config.js')
        assert(options.colors === true)
        assert(options.watch === false)
      })
    })

    describe('with no args and a config', () => {
      it('should be overwitten with config', () => {
        const context = path.join(__dirname, 'fixtures')
        console.log('input context:', context)
        const options = parse(['--context', context])
        assert(options.context === context)
        assert(options.entry === '**/*.html')
        assert(options.output === 'dist')
        assert(options.config === 'csspack.config.js')
        assert(options.colors === false)
        assert(options.watch === false)
      })
    })

    describe('with some args and some config', () => {
      it('should be overwitten with args', () => {
        const context = path.join(__dirname, 'fixtures')
        const options = parse(['--context', context, '--colors'])
        assert(options.context === context)
        assert(options.entry === '**/*.html')
        assert(options.output === 'dist')
        assert(options.config === 'csspack.config.js')
        assert(options.colors === true)
        assert(options.watch === false)
      })
    })
  })
})
