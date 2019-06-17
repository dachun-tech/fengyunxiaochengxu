let express = require('express');
let redis = require('redis');
let flash = require('connect-flash');
let path = require('path');
let session = require('express-session');
let redisStore = require('connect-redis')(session);
let client = redis.createClient();
let mongoose = require('mongoose');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let methodOverride = require('method-override');

let app = express();
let config = require('./config')();
let web_routes = require('./routes/web_route');
let common_routes = require('./routes/common_route');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(cookieParser());

app.use(session({
    secret:"1234567890",
    // create new redis store.
    store: new redisStore({host: 'localhost', port: 6379, client: client, ttl: 7200}),
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(flash());
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
        app.use('/', web_routes);
        app.use('/common', common_routes);
        app.listen(config.port, function () {
            console.log(new Date().toLocaleString() + ": Backend Server is running: http://127.0.0.1:" + config.port);
        })
    }
});