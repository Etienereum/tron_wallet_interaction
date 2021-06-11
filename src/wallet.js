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
const fetch = require('node-fetch');
const hdWallet = require('tron-wallet-hd');
const utils = hdWallet.utils;

const baseURL = 'https://api.shasta.trongrid.io'

const TronWeb = require('tronweb')
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider(baseURL);
const solidityNode = new HttpProvider(baseURL);
const eventServer = new HttpProvider(baseURL);
const privateKey = "840be81abd92c3451de57fd440c1f00bcd23714e110a71ec40b80f431f5a5260";
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

let accountArr = {}
let privkeyArr = []
let privkeyMaster
let addressMaster
    
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
        throw new Error("Read Bad Seed Phrase")

    // Write Private keys to a txt file
    for (let acc in accountArr) {
        for (let privKey in accountArr[acc]) {
            if (privKey == 'privateKey') {
                privkeyArr.push(accountArr[acc][privKey])
            }
        }
    }

    fs.writeFile('privkeys.txt', privkeyArr.toString(), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("All Private Keys have been saved!");
    });

    privkeyMaster = privkeyArr[0]

    // Read 1st Private Key from the txt and funded it Manually
    const isValidPK = utils.validatePrivateKey(privkeyMaster)

    if (isValidPK) {
        addressMaster = await utils.getAccountFromPrivateKey(privkeyMaster);
        console.log({ addressMaster })
    }
    let balMaster = await tronWeb.trx.getBalance(addressMaster)
    console.log(`'Master Address Balance is, ${balMaster}`)

    // Read other Private keys and fund them from the 1st account
    for (let i = 1; i < privkeyArr.length; i++){
        let address = await utils.getAccountFromPrivateKey(privkeyArr[i])
        let tx = await tronWeb.trx.sendTransaction(address, 10000000, privkeyMaster);

        if (tx.result) {
            //Display all Wallet addresses.
            let balance = await tronWeb.trx.getBalance(address)
            console.log(`${i}) Balance of ${address}, is ${balance}`)
        } else
            throw new Error(`Tranfer to ${address} was not successful`)
    }

    console.log("*****  Reversing all Transasactions  *****")

    // Read other Private keys and fund them from the 1st account
    for (let i = 1; i < privkeyArr.length; i++){
        let address = await utils.getAccountFromPrivateKey(privkeyArr[i])
        let tx = await tronWeb.trx.sendTransaction(addressMaster, 10000000, privkeyArr[i] );

        if (tx.result) {
            //Display all Wallet addresses.
            let balance = await tronWeb.trx.getBalance(address)
            console.log(`${i}) Balance of ${address}, is ${balance}`)
        } else
            throw new Error(`Tranfer from ${address} was not successful`)
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

createWallet()