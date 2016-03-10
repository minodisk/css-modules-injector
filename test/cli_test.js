const assert = require('power-assert')
const cli = require('../lib/cli')

describe('cli', () => {

  describe('input', () => {
    it('should be specified with --input', () => {
      assert(cli.parse(['--input', 'foo/bar.html']).input === 'foo/bar.html')
    })
    it('should be specified with --i', () => {
      assert(cli.parse(['-i', 'foo/bar.html']).input === 'foo/bar.html')
    })
  })

  describe('css', () => {
    it('should be specified with --css', () => {
      assert(cli.parse(['--css', 'foo/bar.css']).css === 'foo/bar.css')
    })
    it('should be specified with --c', () => {
      assert(cli.parse(['-c', 'foo/bar.css']).css === 'foo/bar.css')
    })
  })

  describe('output', () => {
    it('should be specified with --output', () => {
      assert(cli.parse(['--output', 'dist']).output === 'dist')
    })
    it('should be specified with --o', () => {
      assert(cli.parse(['-o', 'dist']).output === 'dist')
    })
  })

  describe('watch', () => {
    it('should be specified with --watch', () => {
      assert(cli.parse(['--watch']).watch === true)
    })
    it('should be specified with --w', () => {
      assert(cli.parse(['-w']).watch === true)
    })
  })
})
