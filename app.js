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
client.subscribe('hk/machines/results');
app.get('/startRecording', function(req,res){
    console.log(req.query.machinename);
    client.publish('hk/machines/'+req.query.machinename, '{"username":"demouser","bp":"Y","pulse":"Y"}', function() {
        res.json({
            status:"done"
        });
        /*client.subscribe('hk/machines/results');*/
    });
});

app.get('/startRecordingForUser', function(req,res){

    var measure ={};
    measure.bp=req.query.bp=='Y'?'Y':'N';
    measure.pulse=req.query.pulse=='Y'?'Y':'N';
    measure.spo2=req.query.spo2=='Y'?'Y':'N';
    measure.username=req.query.user;
    client.publish('hk/machines/'+req.query.machinename, JSON.stringify(measure), function() {
        res.json({
            status:"done"
        });

/*
        setTimeout(function(){
            var meas = {};
            meas.pulse={};
            meas.pulse.reading=70;
            meas.pulse.color="green";
            meas.bp={};
            meas.bp.systolic=130;
            meas.bp.diastolic=85;
            meas.bp.color="green";
            meas.spo2={};
            meas.spo2.reading=98;
            meas.spo2.color="red";
            meas.comments="<span>Hi</span><br><span>How are you?</span>"
            meas.machine='rasp1';
            meas.username=req.query.user;
            io.sockets.emit('broadcast', {
                payload: meas
            });
        }, 2000);
*/
    });
});

app.get('/getUserRecording', function(req,res){
    console.log(req.query.user);
    Patient
        .find({userid: req.query.user})
        .sort({'date': -1})
        .limit(10)
        .exec(function(err, records) {
            if (err) return console.error(err);
            res.json(records);
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
  client.subscribe('hk/machines');
  client.on('message', function (topic, message, packet) {
        switch (topic){
            case "hk/machines":
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
                break;
            default :
                var patientRecord = new Patient({
                    pulse:message.pulse,
                    bp:{
                        systolic:message.systolic,
                        diastolic:message.diastolic
                    },
                    spo2:message.spo2,
                    userid:req.query.user
                });
                patientRecord.save(function(err, patientRecord){
                    if (err) return console.error(err);
                    //console.log(patientRecord);
                    io.sockets.emit('broadcast', {
                        payload: JSON.parse(message)
                    });
                });

        }
  });
});

mongoose.connect("mongodb://paddy:123456@ds049997.mongolab.com:49997/arduino");
var hkSchema = new mongoose.Schema({
    pulse: Number
    ,
    bp: {
        systolic: Number,
        diastolic: Number
    }
    ,
    spo2: Number,
    userid:String,
    date:{ type: Date, default: Date.now }
});

var Patient = mongoose.model('Patient', hkSchema);

module.exports = app;