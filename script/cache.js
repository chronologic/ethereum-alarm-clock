const NanoCache = require('nano-cache')
const chalk = require('chalk')
const _ = require('lodash')

/// Wrapper over the nano-cache
class Cache {
    constructor(verb) {
        this.cache = new NanoCache()
        this.verbose = verb || false 
        this.mem = []

        this.cache.on('set', (setKey) => {
            this.mem.push(setKey)
            this.log(chalk.green(`New transaction stored~ ${setKey}`))
        })
        this.cache.on('get', (accessedKey) => {
            this.log(chalk.blue(`Accessed transaction~ ${accessedKey}`))
        })
        this.cache.on('del', (deletedKey) => {
            this.log(chalk.yellow(`Removed transaction~ ${deletedKey}`))
        })
        this.cache.on('clear', () => {
            this.log(chalk.red('CLEARED CACHE'))
        })
    }

    set(key, val) {
        this.cache.set(key, val)
    }

    get(key) {
        return this.cache.get(key)
    }

    delete(key) {
        this.mem = _.remove(this.mem, (addr) => {
            addr === key
        })
        this.cache.del(key)
    }

    stored() {
        return this.mem
    }

    length() {
        if (this.mem.length != this.len()) {
            this.log(chalk.red('Incorrect cache...\nQuitting...'))
            process.exit(1)
        } 
        return this.mem.length
    }

    len() {
        return this.cache.stats().count
    }

    stats() {
        return this.cache.stats()
    }

    log(msg) {
        if (this.verbose) console.log(msg)
    }
}

module.exports.Cache = Cache