var express = require('express'),
    request = require('request'),
    mysql = require('mysql'),
    WebSocket = require('ws'),
    mqtt = require('mqtt'),
    router = express.Router();

var connect = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'pvtracer'
});


var client  = mqtt.connect('mqtt://iot.eclipse.org:1883');

client.on('connect', function () {
  client.subscribe('pvtracer/data_incoming/');
});

client.on('message', function (topic, message) {
  // message is Buffer 
  console.log('topic: '+topic+' message: '+message.toString());
  //client.end()
});
/*var ws = new WebSocket.Server({
  perMessageDeflate: false,
  port: 3232
});*/
var ws = new WebSocket('ws://echo.websocket.org');

//connection.connect();

function sendMessage(sendData) {
    console.log('sendData');
    /*
wss.on('connection', function connection(ws) {
	console.log('websocket connected!');
  	console.log('sendMessage: '+JSON.stringify(sendData));
  	//ws.send(JSON.stringify(sendData));
  	ws.send(JSON.stringify(sendData));
  
});*/
    /*
    wss.broadcast = function broadcast(data) {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    };*/
}

// Broadcast to all.
/*
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(data) {
        // Broadcast to everyone else.
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
});*/

ws.on('open', function open() {
  console.log('connected');
  //ws.send(Date.now());
});

ws.on('close', function close() {
  console.log('disconnected');
});

ws.on('message', function incoming(data, flags) {
  console.log(`Roundtrip time: ${Date.now() - data} ms`, flags);

  setTimeout(function timeout() {
  	console.log('Date: '+Date.now());
    ws.send(Date.now());
  }, 500);
});

router
    .post('/queryData', function(req, res) {
        console.log('req.body: ' + JSON.stringify(req.body));

        var query_sql = "SELECT * FROM pvtracer.pvtracer_data WHERE id=(SELECT MAX(id) from pvtracer.pvtracer_data)";
        connect.query(query_sql, function(error, results, fields) {
            console.log('results: ' + JSON.stringify(results));
            res.send(JSON.stringify(results));
            if (error) {
                throw error;
                res.send('SQL error!');
            }
            // connected! 

        });

    })
    .post('/historyData', function(req, res) {
        //console.log('req.body: ' + JSON.stringify(req.body));

        var query_sql = "SELECT * FROM pvtracer.pvtracer_data ORDER BY insertionTime DESC LIMIT 100";
        connect.query(query_sql, function(error, results, fields) {
            //console.log('results: ' + JSON.stringify(results));
            var historyData = results;
            var updateData = [];
            for(var i = 0;i<historyData.length;i++){
              var extractData = JSON.parse(historyData[i].data_x);
              extractData.reverse();
              //console.log('extractData: '+JSON.stringify(extractData));
              var index_T2 =0;
              var currentData = 0;
              for(var j =0;j<extractData.length;j++){
                var count = index_T2 * extractData[j];
                if(count>currentData)currentData=count.toFixed(2);
                index_T2 = index_T2 + 2;
                 //console.log('count: '+count+' index_T2: '+index_T2);
              }
              //console.log('currentData: '+currentData);
              var getDate = new Date(historyData[i].insertionTime).getTime();
              //updateData.push({ getDate , currentData });
              updateData = updateData.concat([[getDate,Number(currentData)]]);
            }
            //console.log('updateData: '+JSON.stringify(updateData));
            res.send(JSON.stringify(updateData));
            //res.send(JSON.stringify(results));
            if (error) {
                throw error;
                res.send('SQL error!');
            }
            // connected! 

        });

    })
    .post('/updateData', function(req, res) {
        console.log('req.body: ' + JSON.stringify(req.body));

        //var query_sql = 'SELECT * FROM pvtracer_data';
        //var query_sql = "INSERT INTO pvtracer.pvtracer_data (insertionTime, data_collected) VALUES ( CURRENT_TIMESTAMP,'" + JSON.stringify(req.body.Data) + "')";
        var query_sql = "INSERT INTO pvtracer.pvtracer_data (insertionTime, data_x, data_y) VALUES ( CURRENT_TIMESTAMP,'" + JSON.stringify(req.body.data_x) + "','" + JSON.stringify(req.body.data_y) + "')";
        connect.query(query_sql, function(error, results, fields) {
            console.log('results: ' + JSON.stringify(results));
            /*
            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(data) {
                    // Broadcast to everyone else.
                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(data);
                        }
                    });
                });
                ws.send(JSON.stringify(req.body.Data));
            });*/
            //sendMessage(req.body);
            //ws.send(Date.now());
            var query_data = {
                "data_x": req.body.data_x,
                "data_y": req.body.data_y
            };
            console.log('query_data: '+JSON.stringify(query_data));
            client.publish('pvtracer/data_incoming/', JSON.stringify(query_data));
            if (error) throw error;
            // connected! 
        });
        /* send websocket data */
        /*ws.send('{"test":"test"}', function ack(error) {
          // If error is not defined, the send has been completed, otherwise the error 
          // object will indicate what failed. 
        });*/
        /* end send websocket data */
        res.send('Receive data from server side');
    });

module.exports = router;