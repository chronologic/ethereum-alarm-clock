const mem_cache = require('memory-cache')
// const chalk = require('chalk')
const _ = require('lodash')

//// wrapper over memory-cache
class Cache22 {
    constructor (talkative) {
        this.verbose = talkative
        // this.timeout = timeout // time that cache entires last
        this.cache = new mem_cache.Cache() 
        this.mem = []
    }

    set (k, v) {
        this.mem.push(k)
        this.cache.put(k, v)
        this.talk(`stored ${k}`)
    }

    get (k) {
        if (this.cache.get(k) === null) throw new Error('attempted to access key entry that does not exist')
        this.talk(`accessed ${k}`)
        return this.cache.get(k)
    }

    has (k) {
        if (this.cache.get(k) === null) {
            return false 
        }
        return true
    }

    del (k) {
        this.mem = _.remove(this.mem, (addr) => {
            addr === k
        })
        this.cache.del(k)
        this.talk(`deleted ${k}`)
    }

    len () {
        return this.cache.size()
    }

    stored () {
        return this.mem 
    }

    talk (msg) {
        if (this.verbose) console.log(msg)
    }
}

module.exports.Cache22 = Cache22
