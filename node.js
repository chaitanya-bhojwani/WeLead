const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');
const rp = require('request-promise');
const hbs = require('hbs');

const Blockchain = require('./serverFiles/blockchain');

const nodeAddress = uuid().split('-').join('');
const bitcoin = new Blockchain();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'hbs');

const port = process.argv[2];

// Route to render the homepage
app.get('/', (req, res) => {
    res.render('index.hbs');
});

// Route to render the contact us 
app.get('/contact', (req, res) => {
    res.render('contact.hbs')
});

// Route to get entire blockchain
app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});

// Route to create a new transaction
app.post('/transaction', (req, res) => {
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionsToPendingTransactions(newTransaction);

    res.json({ note: `Transaction will be added in the block ${blockIndex}` })
});

// Create new transactiono and broadcast it to entire network
app.post('/transaction/broadcast', (req, res) => {
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    bitcoin.addTransactionsToPendingTransactions(newTransaction);

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            res.json({ note: 'Transaction created and broadcast successfully' });
        });
});

app.get('/mine', (req, res) => {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    }
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash,currentBlockData, nonce);

    // bitcoin.createNewTransaction(12.5, "00", nodeAddress)

    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl+ '/recieveNewBlock',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        }

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            // Broadcast mining reward also
            const requestOptions = {
                uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 12.5,
                    sender: "00",
                    recipient: nodeAddress,
                    json: true
                }
            }

            return rp(requestOptions);
        })
        .then(data => {
            res.json({
                note: "New block mined successfully",
                block: newBlock
            });
        });

});

app.post('/recieveNewBlock', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 ===newBlock['index'];
    
    if(correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];

        res.json({
            note: 'New Block Recieved and accepted',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'New block rejected',
            newBlock: newBlock
        });
    }
});

// Register a node and broadcast that node to the entire network
app.post('/registerAndBroadcastNode', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    if(bitcoin.networkNodes.indexOf(newNodeUrl) === -1) {
        bitcoin.networkNodes.push(newNodeUrl);
    }

    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        // '/registerNode
        const requestOptions = {
            uri: networkNodeUrl + '/registerNode',
            method: 'POST',
            body: {
                newNodeUrl
            },
            json: true
        };

        regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises)
        .then(data => {
            // Some other operations
            // use the data

            const bulkRegisterOptions = {
                uri: newNodeUrl + '/registerNodesBulk',
                method: 'POST',
                body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl] },
                json: true
            }
            return rp(bulkRegisterOptions);
        })
        .then(data => {
            res.json({ note: 'New node registered with network successfully!'});
        });
});

// Register a single node with the chain of network nodes
app.post('/registerNode', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    const nonExistingNode = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    if (nonExistingNode && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl);
    res.json({ note: 'New node registered successfully.' });
});

// Register multiple nodeds at once
app.post('/registerNodesBulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;

    allNetworkNodes.forEach(networkNodeUrl => {
        const notExistingNode = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        if (notExistingNode && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);
    });

    res.json({ note: 'Bulk registration successful' })
});

app.listen (port, () => {
   console.log(`Server is up and running on port ${port}`) ;
});