const Module = require('module')
const vm = require('vm')
const fs = require('fs-extra')
const pathFn = require('path')

class Extend {
  constructor(acyort) {
    this._acyort = acyort
    this._config = acyort.config
    this._types = [
      'after_post_get',
      'after_post_process',
      'after_post_render',
    ]
    this._functions = {
      after_post_get: [],
      after_post_process: [],
      after_post_render: [],
    }
  }

  register(type, fn) {
    if (this._types.indexOf(type) > -1 && typeof fn === 'function') {
      this._functions[type].push(fn)
    }
  }

  init() {
    (this._config.scripts || [])
    .map(script => pathFn.join(process.cwd(), this._config.scripts_dir, script))
    .forEach((script) => {
      if (fs.existsSync(script)) {
        this.load(script)
      }
    })
    return Promise.resolve()
  }

  functions(type) {
    return this._functions[type]
  }

  // https://github.com/hexojs/hexo/blob/master/lib/hexo/index.js#L206
  load(path) {
    const moduleFn = new Module(path)
    const requireFn = p => moduleFn.require(p)
    const file = fs.readFileSync(path)
    const script = `(function(exports, require, module, __filename, __dirname, acyort) {${file}})`
    const fn = vm.runInThisContext(script, path)
    const {
      _nodeModulePaths,
      _resolveFilename,
      _extensions,
      _cache,
    } = Module

    moduleFn.filename = path
    moduleFn.paths = _nodeModulePaths(path)

    requireFn.resolve = request => _resolveFilename(request, moduleFn)
    requireFn.main = process.mainModule
    requireFn.extensions = _extensions
    requireFn.cache = _cache

    fn(moduleFn.exports, requireFn, moduleFn, path, pathFn.dirname(path), this._acyort)
  }
}

module.exports = Extend
