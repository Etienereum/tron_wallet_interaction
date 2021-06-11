/** 
 * 1) Create Single Mnemonic.
 * 2) Validate the above Mnemonic.
 * 3) Generate new set of 10 accounts (i.e. Private Keys and Wallet Addresses).
 * 4) Write Private keys to a txt file.
 * 5) Read 1st Private Key from the txt and fund.
 * 6) Read other Private keys and fund from the 1st account.
 * 7) Display all Wallet addresses.
 * 8) Transfer Back all funds to 1st account.
*/
const fs = require('fs');
const tronweb = require('tronweb');
const fetch = require('node-fetch');
const hdWallet = require('tron-wallet-hd');
const utils = hdWallet.utils;

let accountArr = {}
let privkeyArr = []
let addressMaster, hexAddrMaster
    
const generateSeed = async () => {
    const seedphrase = utils.generateMnemonic();
    
    fs.writeFile('seedphrase.txt', seedphrase, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log('Mnemonic:', seedphrase)
        console.log("Seed has been saved!");
    }); 
}

const createWallet = async () => {
    
    let seedphrase = fs.readFileSync('seedphrase.txt', 'utf8' , (err, seed) => {
        if (err) {
            throw new Error(err)
        }
        return seed;
    })
    
    const isValidSeed = utils.validateMnemonic(seedphrase);
    
    if (isValidSeed) {
        accountArr = await utils.generateAccountsWithMnemonic(seedphrase, 10);
    } else
        throw new Error("Bad Seed Phrase")
    // console.log(accountArr)

    // Write Private keys to a txt file
    for (let acc in accountArr) {
        for (let privateKey in accountArr[acc]) {
            if (privateKey == 'privateKey') {
                // console.log(accountArr[acc][privateKey])
                privkeyArr.push(accountArr[acc][privateKey])
            }
        }
    }

    fs.writeFile('privkeys.txt', privkeyArr.toString(), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });

    // Read 1st Private Key from the txt and funded it Manually
    let MasterPK = privkeyArr[0]
    const isValidPK = utils.validatePrivateKey(MasterPK)

    if (isValidPK) {
        addressMaster = await utils.getAccountFromPrivateKey(MasterPK);
        console.log(addressMaster)

        hexAddrMaster = tronweb.address.toHex(addressMaster)
        console.log(hexAddrMaster)
    }
    let bal = await getBalance(hexAddrMaster)
    console.log('Main Addr Bal', bal)

    // Read other Private keys and fund them from the 1st account
    for (let i = 1; i < privkeyArr.length; i++){
        let address = await utils.getAccountFromPrivateKey(privkeyArr[i])
        let hexAddr = tronweb.address.toHex(address)
        let bal = await getBalance(hexAddr)
        console.log(privkeyArr[i], address, hexAddr, bal);
        console.log(hexAddrMaster, hexAddr, 10)

        let transfer = await blockchainTX(hexAddrMaster, hexAddr, 10)
        // console.log(transfer)
        // if (transfer) {
            // Display all Wallet addresses.
            // let balance = await getBalance(hexAddr)
            // console.log(`Balance of ${address}, is ${balance}`)
        // } else
        //     throw new Error('Tranfer was not successful')
    }
}

const getBalance = async (hexAddr) => {
    const url = 'https://api.shasta.trongrid.io/wallet/getaccount';
    const options = {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: hexAddrMaster })
    };

    return fetch(url, options).then(res => res.json())
        .then((json) => { return json.balance })
        .catch(err => console.error('error:' + err));
}

const blockchainTX = async (sender, receiver, amount) => {
    const url = 'https://api.shasta.trongrid.io/wallet/createtransaction';    
    const options = {
        method: 'POST',
        headers: {
            Accept: 'application/json', 'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "to_address": receiver,
            "owner_address!": sender,
            "amount": amount
        })
    };

    return fetch(url, options).then(res => res.json())
        .then((json) => {
            console.log(json)
            return json
        })
        .catch(err => console.error('error:' + err));
}

createWallet()