'use strict';

var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    io = require('socket.io'),
    morgan = require('morgan'),
    routes = require('./routes'),
// api = require('./routes/api'),
    http = require('http'),
    path = require('path'),
    cors = require("cors"),
    mqtt = require('mqtt'),
    url = require('url'),
    mongoose = require("mongoose"),
    mqtt_url = url.parse("mqtt://ibuyeqzl:oGtoeTGQPI5b@m11.cloudmqtt.com:16828"),
    auth = (mqtt_url.auth || ':').split(':'),
// Create a client connection
    client = mqtt.createClient(mqtt_url.port, mqtt_url.hostname, {
        username: auth[0],
        password: auth[1]
    }),
    app = module.exports = express();

/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
//app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

var env = process.env.NODE_ENV || 'development';

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);
app.get('/machines', function(req,res){
    res.json({
        rasps: rasps
    });
});
// JSON API
//app.get('/api/name', api.name);

// redirect all others to the index (HTML5 history)
//app.get('*', routes.index);


/**
 * Start Server
 */

var server=http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

io = io.listen(server);
// set up our socket server
require('./sockets/base')(io);
// set socket.io logging level
io.set('log level', 1000);
var rasps=[],found=false;
client.on('connect', function () { // When connected

    // subscribe to a topic
    client.subscribe('hello/world', function () {
        // when a message arrives, do something with it
        client.on('message', function (topic, message, packet) {
            //onerasp=JSON.stringify(message);
            var currentDate = new Date();
            found=false;
            for(var i in rasps){
                if(rasps[i].name==message){
                    rasps[i].lastUpdated=currentDate;
                    rasps[i].lastUpdatedString=currentDate.getHours()+":"+currentDate.getMinutes();
                    found=true;
                    break;
                }
            }
            if(!found){
                rasps.push({
                    name:message,
                    lastUpdated:currentDate,
                    lastUpdatedString:currentDate.getHours()+":"+currentDate.getMinutes()
                });
            }
            for(var i in rasps){
                if(currentDate-rasps[i].lastUpdated>120000)
                    rasps[i].status="Down";
                else
                    rasps[i].status="Up";
            }
            io.sockets.emit('broadcast', {
                payload: rasps
            });
            console.log("Received '" + message + "' on '" + topic + "'");
        });
    });
});



mongoose.connect("mongodb://paddy:123456@ds049997.mongolab.com:49997/arduino");

module.exports = app;