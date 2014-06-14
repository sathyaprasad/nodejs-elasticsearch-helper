var Tuiter = require('tuiter'),
    http = require('http'),
    util = require('util'),
    fs = require('fs'),
    events = require('events'),
    keys = require("./keys.json"),
    conf = require('./config.json'),
    searchService = require('./SearchService.js'),
    eventEmitter = new events.EventEmitter();

var tu = new Tuiter(keys);

var tpm = 0;
var count = 0;
var geocount = 0;
var updates = 0;
var keywords = ['4sq', 'checkin'];
//var keywords = ['checkin','fifa'];

var isInserting = false;
var tweetsArray = [];

//Logging
var log_stream = fs.createWriteStream(conf.log_file, {
    flags: 'w'
});

var log_error = fs.createWriteStream(conf.error_log_file, {
    flags: 'w'
});

eventEmitter.on('log', function(message) {
    log_stream.write(message + "\r\n\r\n");
});

eventEmitter.on('error', function(message) {
    log_error.write(" \r\n ********** ERROR " + new Date() + " ********* \r\n ");
    log_error.write("\r\n" + message + "\r\n");
});

eventEmitter.on('update', function(json, length) {
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': length
    };

    var options = {
        host: conf.host,
        path: '/' + conf.index + '/' + conf.type + '/',
        method: 'POST',
        headers: headers
    };

    // Setup the request.  The options parameter is
    // the object we defined above.
    var req = http.request(options, function(res) {
        res.setEncoding('utf-8');
        var responseString = '';
        res.on('data', function(data) {
            responseString += data;
        });

        res.on('end', function() {
            updates++;

        });
    });

    req.on('error', function(e) {
        // TODO: handle error.
        console.log("!!!!! Error !!!!!!");
        console.log(JSON.stringify(e));
    });

    req.write(json);
    req.end();

});

//logging

var filter = {
    track: keywords,
    language: "en",
    locations: [{
        lat: -90,
        long: -180
    }, {
        lat: 90,
        long: 180
    }]
};

function startStreaming() {
    tu.filter(filter, function(stream) {
        console.log("Twitter stream ready ...");
        stream.on('tweet', function(data) {
            count++;
            tpm++;
            if (data.place) {
                geocount++;
                json = {};
                json.id = data.place.id;
                json.type = data.place.type;
                json.name = data.place.name;
                json.full_name = data.place.full_name;
                json.country = data.place.country;
                json.country_code = data.place.country_code;
                json.bounding_box = {};
                json.bounding_box.type = "polygon";
                json.bounding_box.coordinates = data.place.bounding_box.coordinates;
                json.bounding_box.coordinates[0].push(json.bounding_box.coordinates[0][0]);
                // json.coordinates = data.coordinates.coordinates || null;

                // json_string = JSON.stringify(json);
                eventEmitter.emit("log", JSON.stringify(json));

                action = {};
                action.index = {};
                action.index._index = conf.index;
                action.index._type = conf.type;
                action.index._id = json.id;
                tweetsArray.push(action);
                tweetsArray.push(json);

                //console.log(tweetsArray);
                if (!isInserting && tweetsArray.length >= 100) {
                    isInserting = true;
                    updates += tweetsArray.length / 2;

                    console.log("Geo/Count: " + geocount + "/" + count + " | Updates: " + updates + " |  Inserting: " + isInserting + " | Entries remaining: " + tweetsArray.length / 2);

                    searchService.bulkInsert(tweetsArray, bulk_done, bulk_fail);
                    tweetsArray = [];
                }


            }
        });

        stream.on("error", function(error) {
            // handle errors
            console.log("Stream Error : " + new Date());
            eventEmitter.emit("error", error);
            setTimeout(startStreaming, conf.retryWaitTime);
        });
    });
}

function bulk_done(message) {
    //console.log(JSON.stringify(message));
    //console.log("len: " + tweetsArray.length);

    if (tweetsArray.length >= 100) {
        console.log("Re-Inserting: " + isInserting + " | Entries remaining: " + tweetsArray.length / 2);
        updates += tweetsArray.length / 2;
        searchService.bulkInsert(tweetsArray, bulk_done, bulk_fail);
        tweetsArray = [];
    } else {
        isInserting = false;
    }
}

function bulk_fail(message) {
    console.log(message);
    isInserting = false;
    log_stream.write(message + "\r\n\r\n");
};

startStreaming();

/*

setInterval(function() {
    console.log("#### TPM : " + tpm + " (" + geocount + "/" + count + ") | Updates: " + updates + " #######");
    tpm = 0;
}, 1000 * 5);
*/

process.on('uncaughtException', function(err) {
    util.inspect(err);
});