var Tuiter = require('tuiter')
  	, http = require('http')
  	, config = require('./config.json')
  	, util = require('util')
  	, updateFS = require('./updateFS');



 var tu = new Tuiter(config.keys);


//console.log(config);

var tpm  = 0;
var count = 0;
var geocount = 0;
var updatecount = 0;
var keywords = config.keywords;
var filterObj = null;

if(config.type == "location") {
  filterObj = {locations: config.extent};
}
else { 
    filterObj = {track: keywords};
}

console.log(filterObj);

tu.filter(filterObj, function(stream){
//tu.filter({locations: [{lat: -90, long: -180},{lat: 90, long: 180}]}, function(stream){

      // tweets :)
      stream.on('tweet', function(data){
        
        count ++;
        tpm ++;
        if(data.geo && data.geo.coordinates){
        	console.log(data.geo.coordinates);
        
        	updateFS.update(data, data.geo.coordinates, keywords, function(feature){
            //console.log("INSIDE CALLBACK")
        		//console.log(feature);
            //update ++;
        	});

        	geocount ++;
        	console.log(geocount + "/" + count);
        }

      });

});

setInterval(function() {
  console.log("#### TPM : " + tpm + " #######");
  tpm = 0;

}, 1000*60);

/*
var count2 = 0, geocount2 = 0;
tu2.filter({track: keywords2}, function(stream){
  stream.on('tweet', function(data){
    count2++;
    if(data.geo && data.geo.coordinates){
      geocount2++;
      updateFS.update(data, data.geo.coordinates, keywords2);
      console.log("#2 " + geocount2 + "/" + count2);
    }

  });
});
*/

/*
t.filter({locations: [{lat: -90, long: -180},{lat: 90, long: 180}]}, function(stream){
console.log("inside stream");
 // New tweet
  stream.on("tweet", function(data){
    if(data.geo && data.geo.coordinates){
      console.log({coordinates: data.geo.coordinates
        , screen_name: data.user.screen_name
        , text: data.text
        , pic: data.user.profile_image_url}
      );
    }
  });

  stream.on("delete", function(data){
    //I don't care about deleted tweets
  });

  // Log errors
  stream.on("error", function(error){
    // handle errors
  });

});
*/

process.on('uncaughtException', function(err){
  util.inspect(err);
});



