const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');
const rp = require('request-promise');
const hbs = require('hbs');
const MonkeyLearn = require('monkeylearn');
const unirest = require('unirest');

const Blockchain = require('./serverFiles/blockchain');
const {mongoose} = require('./serverFiles/mongoose');
const {addUser}  = require('./serverFiles/addUser');
const {getUserByEmail} = require('./serverFiles/getUserByEmail');
const {getProfileByUsername} = require('./serverFiles/getProfileByUsername');

const nodeAddress = uuid().split('-').join('');
const bitcoin = new Blockchain();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'hbs');

const port = process.argv[2];

// Route to get landing page
app.get('/', (req, res) => {
    res.render('index.hbs');
}); 

// Route to render contactus page
app.get('/contact', (req, res) => {
    res.render('contact.hbs');
});

// Route to render login page
app.get('/login', (req, res) => {
    res.render('login.hbs');
});

// Route to render signup page
app.get('/signup', (req, res) => {
    res.render('signup.hbs');
});

// Route to add user to network
app.post('/signup', (req, res) => {
    var userData = req.body;

    // var url = 'https://api.monkeylearn.com/v3/extractors/ex_YCya9nrn/extract/';
    // var headers = { 
    //     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
    //     'Content-Type' : 'application/x-www-form-urlencoded',
    //     'Authorization': 'Token 484ec1c557d4bf1f7ebed934e57fbac3933fed2b'
    // };
    // var form = { data: [ 'According to online studies conducted earlier this year for rankings on the best places for female entrepreneurship, India went up on the list compared to its position in 2013! What’s more, India’s female entrepreneurship environment exposes statistics of improvement with respect to women finding opportunities to start ventures (60%), validation with respect to skills (52%) and do not feel the impending doom of failure for their startup (57%). On this happy note, we’ve compiled a list of top women entrepreneurs in India who have made a significant dent in the startup ecosystem.' ] };

    // request.post({ url: url, form: form, headers: headers }, function (e, r, body) {
    //     // your callback body
    //     res.json(body);
    // });

    unirest.post('https://api.monkeylearn.com/v3/extractors/ex_YCya9nrn/extract/')
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Token 484ec1c557d4bf1f7ebed934e57fbac3933fed2b'})
    .send({ "data": [
        userData.desc + ' ' + userData.detaildesc
      ] })
    .end(function (response) {
        console.log(response.body);
        // res.send(response.body);

        var tags = [];
        for (var i=0; i<response.body[0].extractions.length;i++) {
            tags.push(response.body[0].extractions[i].parsed_value);
        }
        userData.tags = tags;

        unirest.post('https://api.monkeylearn.com/v3/classifiers/cl_5vWJMjGc/classify/')
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Token 484ec1c557d4bf1f7ebed934e57fbac3933fed2b'})
        .send({ "data": [
            userData.desc + ' ' + userData.detaildesc
        ] })
        .end(function (response) {
            console.log(response.body);
            // res.send(response.body);

            var businessTags = [];
            for (var i=0; i<response.body[0].classifications.length;i++) {
                businessTags.push(response.body[0].classifications[i].tag_name);
            }
            userData.businessTags = businessTags;

            addUser(userData, (err, doc) => {
                if (err) {
                    res.render('404.hbs');
                }

                res.redirect(`/profile/${req.body.email}`);
            });
        });
        
    });
    
   
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.pass;

    getProfileByUsername(username, (err, doc) => {
        if (err) {
            res.render('404.hbs');
        } else if (!doc) {
            res.render('404.hbs');
        }

        if(doc.pass === password) {
            res.redirect(`/user/${username}`);
        }
        // res.render('404.hbs');

        res.redirect(`/user/${username}`);
    });
});

// Route to post data to monkelearn
app.get('/monkeyPost', (req, res) => {
    // var url = 'https://api.monkeylearn.com/v3/extractors/ex_YCya9nrn/extract/';
    // var headers = { 
    //     'Content-Type' : 'application/json',
    //     'Authorization': 'Token 484ec1c557d4bf1f7ebed934e57fbac3933fed2b'
    // };
    // var body = {
    //     "data": [
    //       "Elon Musk has shared a photo of the spacesuit designed by SpaceX. This is the second image shared of the new design and the first to feature the spacesuit’s full-body look."
    //     ]
    //   };

    // request.post({ url: url, body: body, headers: headers }, function (e, r, body) {
    //     // your callback body
    //     res.json(body);
    // });
    
    unirest.post('https://api.monkeylearn.com/v3/extractors/ex_YCya9nrn/extract/')
    .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Token 484ec1c557d4bf1f7ebed934e57fbac3933fed2b'})
    .send({ "data": [
        "Elon Musk has shared a photo of the spacesuit designed by SpaceX. This is the second image shared of the new design and the first to feature the spacesuit’s full-body look."
      ] })
    .end(function (response) {
    console.log(response.body);
    res.send(response.body);
    });
});

// Route to redirect to error message
app.get('/err', (req, res) => {
    res.render('404.hbs');
})

// Route to fetch user profile based on the email
app.get('/profile/:email', (req, res) => {
    const email = req.params.email;
    // res.send('profile.hbs');
    getUserByEmail(email, (err, doc) => {
        if (err) {
            res.send('404.hbs');
        }

        res.render('profile.hbs', doc[0]);
    })
});


// Route to fetch user profile based on the username
app.get('/user/:username', (req, res) => {
    const username = req.params.username;
    // res.send('profile.hbs');
    getProfileByUsername(username, (err, doc) => {
        if (err) {
            res.send('404.hbs');
        }

        res.render('profile.hbs', doc[0]);
    })
});

// Route to get entire blockchain
app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});

// Route to open block explorer
app.get('/explorer', (req, res) => {
    res.render('explorer.hbs');
});

// Route to show profile
app.get('/profile', (req, res) => {
    res.render('profile.hbs');
});

// Route to open video call
app.get('/videoCall', (req, res) => {
    res.render('videoCall.hbs');
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
    // const lastBlock = bitcoin.getLastBlock();
    // const previousBlockHash = lastBlock['hash'];
    // const currentBlockData = {
    //     transactions: bitcoin.pendingTransactions,
    //     index: lastBlock['index'] + 1
    // }
    // const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    // const blockHash = bitcoin.hashBlock(previousBlockHash,currentBlockData, nonce);

    // // bitcoin.createNewTransaction(12.5, "00", nodeAddress)

    // const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    // const requestPromises = [];
    // bitcoin.networkNodes.forEach(networkNodeUrl => {
    //     const requestOptions = {
    //         uri: networkNodeUrl+ '/recieveNewBlock',
    //         method: 'POST',
    //         body: { newBlock: newBlock },
    //         json: true
    //     }

    //     requestPromises.push(rp(requestOptions));
    // });

    // Promise.all(requestPromises)
    //     .then(data => {
    //         // Broadcast mining reward also
    //         const requestOptions = {
    //             uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
    //             method: 'POST',
    //             body: {
    //                 amount: 12.5,
    //                 sender: "00",
    //                 recipient: nodeAddress,
    //                 json: true
    //             }
    //         }

    //         return rp(requestOptions);
    //     })
    //     .then(data => {
    //         res.json({
    //             note: "New block mined successfully",
    //             block: newBlock
    //         });
    //     });

    const lastBlock = bitcoin.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: bitcoin.pendingTransactions,
		index: lastBlock['index'] + 1
	};
	const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
	const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
	const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

	const requestPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/receiveNewBlock',
			method: 'POST',
			body: { newBlock: newBlock },
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		const requestOptions = {
			uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
			method: 'POST',
			body: {
				amount: 12.5,
				sender: "00",
				recipient: nodeAddress
			},
			json: true
		};

		return rp(requestOptions);
	})
	.then(data => {
		res.json({
			note: "New block mined & broadcast successfully",
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

// consensus
app.get('/consensus', function(req, res) {
	const requestPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/blockchain',
			method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(blockchains => {
		const currentChainLength = bitcoin.chain.length;
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;

		blockchains.forEach(blockchain => {
			if (blockchain.chain.length > maxChainLength) {
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
				newPendingTransactions = blockchain.pendingTransactions;
			};
		});


		if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))) {
			res.json({
				note: 'Current chain has not been replaced.',
				chain: bitcoin.chain
			});
		}
		else {
			bitcoin.chain = newLongestChain;
			bitcoin.pendingTransactions = newPendingTransactions;
			res.json({
				note: 'This chain has been replaced.',
				chain: bitcoin.chain
			});
		}
	});
});

app.get('/block/:blockHash', (req, res) => {
    const blockHash = req.params.blockHash;
    
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        block: correctBlock
    }); 
});

app.get('/transaction/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;
    const transactionData = bitcoin.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    })
});

app.get('/address/:address', (req, res) => {
    const address = req.params.address;

    const addressData = bitcoin.getAddressData(address);
    res.json({
        addressdata: addressData
    });
});

// Route to test monkeylearn
app.get('/monkey', (req, res) => {
    const ml = new MonkeyLearn('484ec1c557d4bf1f7ebed934e57fbac3933fed2b');
    let model_id = 'ex_YCya9nrn'
    let data = ["Elon Musk has shared a photo of the spacesuit designed by SpaceX. This is the second image shared of the new design and the first to feature the spacesuit’s full-body look."]
    ml.extractors.extract(model_id, data).then(resp => {
        console.log(resp.body);
        res.json(resp.body);
    })
});

app.listen (port, () => {
   console.log(`Server is up and running on port ${port}`) ;
});

