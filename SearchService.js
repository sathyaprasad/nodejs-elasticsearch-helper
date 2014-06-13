var elasticsearch = require('elasticsearch'),
    conf = require('./config.json');

var inserted = 0;

//1. init search client
var client = new elasticsearch.Client({
    host: conf.host,
    log: {
        type: 'file',
        level: 'trace',
        path: conf.elastic_search_log_file
    }
});

//1.5 clean database
var deleteIndex = function() {
    client.indices.delete({
        index: conf.index
    }, function(error, response) {
        if (error) {
            console.log(JSON.stringify(error));
        } else {
            console.log(JSON.stringify(response));
            createIndex();
        }
    })
};

var createIndex = function() {
    client.indices.create({
        index: conf.index,
        type: conf.type
    }, function(error, response) {
        if (error) {
            console.log(JSON.stringify(error));
        } else {
            console.log(JSON.stringify(response));
            putMapping();
        }
    });
}

var putMapping = function() {
    var index = conf.index;
    var type = conf.type;
    client.indices.putMapping({
        index: conf.index,
        type: conf.type,
        body: {
            "properties": {
                "bounding_box": {
                    "type": "geo_shape",
                    "tree": "quadtree",
                    "precision": "1m"
                }
            }
        }
    }, function(error, response) {
        if (error) {
            console.log(JSON.stringify(error));
        } else {
            console.log(JSON.stringify(response));
        }
    });
}

deleteIndex();

//2. add mapping


//3. bulk insert
exports.bulkInsert = function(jsonArray, callback, errback) {
    inserted += jsonArray.length / 2;
    client.bulk({
        body: jsonArray
    }, function(err, resp) {
        if (err) {
            console.error('************* bulk fail ************* ');
            //console.error(err);
            //eventEmitter.emit('bulk_fail', err);            
            if (errback) errback(resp);
        } else {
            console.log("total inserted: " + inserted);
            console.log('************* bulk done ************* ');
            //console.log(resp);
            //eventEmitter.emit('bulk_done', resp);
            if (callback) callback(resp);
        }

    });
}