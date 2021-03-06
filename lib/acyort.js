const Logger = require('./logger')
const Fetcher = require('./fetcher')
const Processor = require('./processor')
const Generator = require('./generator')
const Extend = require('./extend')
const config = require('./config')

class Acyort {
  constructor() {
    this.config = config
    this.logger = new Logger()
    this.extend = new Extend(this)
    this._fetcher = new Fetcher()
    this._processor = new Processor()
    this._generator = new Generator()
  }

  exec(type, data) {
    const functions = this.extend.functions(type).map(f => f(data))
    return Promise.all(functions).then(() => data)
  }

  init() {
    this.extend.init()
    .then(() => this._fetcher.fetch())
    .then(data => this.exec('after_post_get', data))
    .then(data => this._processor.process(data))
    .then(data => this.exec('after_post_process', data))
    .then(data => this._generator.generate(data))
    .then(() => this.exec('after_post_render', null))
    .catch(err => this.logger.error(err))
  }
}

module.exports = Acyort
