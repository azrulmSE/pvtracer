var express = require('express'),
    bodyParser = require('body-parser'),
    app = express();

app
    .use(bodyParser.urlencoded({
        extended:true
    }))
    .use(bodyParser.json())
    .use(express.query())
    .use(function(req, res, next) {
          res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
              next();
    })
    .use('/api', require('./routes/api'))
    .use(express.static('./public'))
    .get('/', function (req, res) {
      res.sendfile('public/main.html')
    })
    .listen(3000);
    console.log('PvTracer run on port 3000 ....');