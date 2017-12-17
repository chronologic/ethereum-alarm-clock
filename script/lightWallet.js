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

        fs.writeFileSync(
            file,
            JSON.stringify(this.wallet.encrypt(password))
        )
        this.wallet.clear()
        if (!this.wallet.length === 0) {
            throw new Error(`Something went wrong when saving keyfile. Assume file: ${file} is corrupted and try again.`)
        }
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
    sendFromNext (address, methodData, gasPrice) {
        const next = nonce++ % this.wallet.length 
        this.sendFromIndex(next, address, methodData)
    }

    sendFromIndex (index, address, methodData, gasPrice) {
        if (index > this.wallet.lenth) {
            console.log('Index is outside of range of addresses in this wallet!')
            return
        }
        this.web3.sendTransaction({
            from: index,
            to: address,
            gas: 4000000,
            gasPrice: 1000, 
            data: methodData
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