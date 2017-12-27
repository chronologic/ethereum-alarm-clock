const fs = require('fs')

class Logger {

    // 1 - debug
    // 2 - info / cache
    // 3 - error

    constructor(logfile) {
        if (logfile === 'console') {
            this.logToFile = false
        } else {
            this.logToFile = true
            this.logfile = logfile
            fs.writeFileSync(this.logfile, "\n")
        }
    }
    
    debug (msg) {
        if (this.logToFile) {
            fs.appendFileSync(this.logfile, `[debug] ${msg}\n`)
        } else {
            console.log(`[debug] ${msg}`)
        }

    }

    error (msg) {
        if (this.logToFile) {
            fs.appendFileSync(this.logfile, `[error] ${msg}\n`)
        } else {
            console.log(`[error] ${msg}`)
        }

    }

    info (msg) {
        if (this.logToFile) {
            fs.appendFileSync(this.logfile, `[info] ${msg}\n`)
        } else {
            console.log(`[info] ${msg}`)
        }

    }

    cache (msg) {
        if (this.logToFile) {
            fs.appendFileSync(this.logfile, `[cache] ${msg}\n`)
        } else {
            console.log(`[cache] ${msg}`)
        }

    }
}

module.exports.Logger = Logger