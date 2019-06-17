let express = require('express');
let mongoose = require('mongoose');
let cors = require('cors');
let bodyParser = require('body-parser');
let methodOverride = require('method-override');
let path = require('path');

let app = express();
let config = require('./config')();
let api_routes = require('./routes/api_route');
app.use(cors());

app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.text({type:'*/xml'}));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(express.static(path.join(__dirname, 'public')));


app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
mongoose.connect('mongodb://localhost:' + config.mongo.port + '/' + config.mongo.dbname , {useCreateIndex: true, useNewUrlParser: true,}, function(err, db) {
    if (err) console.log("MongoDB Server is not running ...");
    else {
        app.use('/api', api_routes);
        app.listen(config.api_port, function () {
            console.log("Api Server is running: http://127.0.0.1:" + config.api_port);
        })
    }
});