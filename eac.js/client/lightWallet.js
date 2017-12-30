const fs = require('fs')

/// Wrapper class over the essiential functionality of the light wallet
/// provided in web3 library. Uses its own instance of web3 to stay
/// sanitary.
class LightWallet {
    constructor(web3) {
        this.web3 = web3
        this.wallet = this.web3.eth.accounts.wallet
        this.nonce = 0
    }

    create (nAccounts) {
        this.wallet.create(nAccounts)
    }

    encryptAndStore (file, password) {
        if (this.wallet.length === 0) {
            return 
        }

        fs.open(file, 'wx', (err, fd) => {
            if (err) {
                if (err.code === 'EEXIST') {
                    console.error(`${file} already exists, will not overwrite`);
                    return;
                }
                throw err;
            }
            
            fs.writeFileSync(
                file,
                JSON.stringify(this.wallet.encrypt(password))
            )
            this.wallet.clear()
            if (!this.wallet.length === 0) {
                throw new Error(`Something went wrong when saving keyfile. Assume file: ${file} is corrupted and try again.`)
            }
        })
    }

    decryptAndLoad (file, password) {
        if (this.wallet.length > 0) {
            console.log('Wallet is already loaded! Returning without loading new wallet...')
            return
        }

        this.wallet.decrypt(
            JSON.parse(fs.readFileSync(file)),
            password
        )
    }

    /// Cycles through accounts and sends the transaction from next up.
    sendFromNext (recip, val, gasLimit, gasPrice, data) {
        const next = this.nonce++ % this.wallet.length 
        return this.sendFromIndex(
            next, recip, val, gasLimit, gasPrice, data
        )
    }

    sendFromIndex (index, recip, val, gasLimit, gasPrice, data) {
        if (index > this.wallet.length) {
            console.log('Index is outside of range of addresses in this wallet!')
            return
        }
        return this.web3.eth.sendTransaction({
            from: index,
            to: recip,
            value: val,
            gas: gasLimit,
            gasPrice: gasPrice, 
            data: data
        })
    }

    getAccounts () {
        let i = 0, res = new Array()
        while (i < this.wallet.length) {
            res.push(this.wallet[i].address)
            i++
        }
        return res
    }

}

module.exports.LightWallet = LightWallet