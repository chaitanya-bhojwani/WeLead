const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');

// Using a constructor function

function Blockchain () {
    this.chain = [];
    this.pendingTransactions = [];

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    // Add genesis block
    this.createNewBlock(100, '0', '0');
}

// Using a class

// class Blockchain {
//     constructor () {
//         this.chain = [];
//         this.pendingTransactions = [];
//     }

//     // ...
// }

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
}

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length-1];
}

Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
    const newTransaction =  {
        transactionId: uuid().split('-').join(''),
        amount: amount,
        sender: sender,
        recipient: recipient
    };

    return newTransaction;
}

Blockchain.prototype.addTransactionsToPendingTransactions = function (transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    // ... return hash SHA256
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);

    return hash;
}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    // Increment nonce and runthis hash
    while (hash.substring(0,4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
}

module.exports = Blockchain;