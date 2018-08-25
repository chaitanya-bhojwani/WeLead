const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');

const port = process.env.PORT || 3000;

const app = express();
app.use(bodyParser());
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'hbs');

app.get('/', (req, res) => {
    res.render('index.hbs', { name: 'MD' });
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});