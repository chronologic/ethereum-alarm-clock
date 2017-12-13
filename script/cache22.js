const mem_cache = require('memory-cache')
const chalk = require('chalk')
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
        console.log(`stored ${k}`)
    }

    get (k) {
        if (this.cache.get(k) === null) throw new Error('attempted to access key entry that does not exist')
        console.log(`accessed ${k}`)
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
        console.log(`deleted ${k}`)
    }

    len () {
        return this.cache.size()
    }

    stored () {
        return this.mem 
    }
}

module.exports.Cache22 = Cache22
