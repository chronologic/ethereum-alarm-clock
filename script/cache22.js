const mem_cache = require('memory-cache')
const _ = require('lodash')

//// wrapper over memory-cache
class Cache22 {
    constructor (logger) {
        this.log = logger
        // this.timeout = timeout // time that cache entires last
        this.cache = new mem_cache.Cache() 
        this.mem = []
    }

    set (k, v) {
        if (_.indexOf(this.mem, k) === -1) {
            this.mem.push(k)
        }
        this.cache.put(k, v)
        this.log.cache(`stored ${k} with value ${v}`)
    }

    get (k) {
        if (this.cache.get(k) === null) throw new Error('attempted to access key entry that does not exist')
        this.log.cache(`accessed ${k}`)
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
        this.log.cache(`deleted ${k}`)
    }

    len () {
        return this.cache.size()
    }

    stored () {
        return this.mem 
    }
}

module.exports.Cache22 = Cache22
