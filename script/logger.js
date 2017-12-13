class Logger {
    
    debug (msg) {
        console.log(`[debug] ${msg}`)
    }

    error (msg) {
        console.log(`[error] ${msg}`)
    }

    info (msg) {
        console.log(`[info] ${msg}`)
    }
}

module.exports.Logger = Logger