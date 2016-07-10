var request = require("request");
var async = require('async');

/**
 * GET /
 * Visualizer index
 */

// Update dates string
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

// Request function
function metricBrowserDataRequest(optionsOld, startTime, endTime, timeInterval, callback){

	// Compile request options
	var options = optionsOld;
	"2016-07-10T06:08:00.000Z"
	var startTimeObj = new Date(startTime);
	var startTimeString = 
		startTimeObj.getFullYear() + "-" + 
		addZero(startTimeObj.getMonth()) + "-" + 
		addZero(startTimeObj.getDay()) + "T" + 
		addZero(startTimeObj.getHour()) + ":" + 
		addZero(startTimeObj.getMinute()) + ":" +
		addZero(startTimeObj.getSecond()) + ".000Z";

	var endTimeObj = new Date(endTime);
	var endTimeString = 
		endTimeObj.getFullYear() + "-" + 
		addZero(endTimeObj.getMonth()) + "-" + 
		addZero(endTimeObj.getDay()) + "T" + 
		addZero(endTimeObj.getHour()) + ":" + 
		addZero(endTimeObj.getMinute()) + ":" +
		addZero(endTimeObj.getSecond()) + ".000Z";

	options.body = "{'metricDataQueries':[{'metricId':" + metricId + ",'entityId':" + entityId + ",'entityType':'APPLICATION'}],'timeRangeSpecifier':{'type':'BETWEEN_TIMES','startTime':'" + startTimeString + "','endTime':'" + endTimeString + "','durationInMinutes':" + ceil(timeInterval) + "},'metricBaseline':null,'maxSize':3000}";

	options.headers.'content-length' = options.body.length; // Get string length function

	request(options, function (error, response, body) {
		var parsedResp = JSON.parse(body);
		var timeStamp = parsedResp[0].dataTimeslices[0].startTime;
		var value = parsedResp[0].dataTimeslices[0].metricValue.value;
	  callback({"time": timeStamp, "value": value});
	});
}

// Index visualize
exports.index = (req, res) => {
  res.render('visualizer', {
    title: 'Visualizer', chartData: chartData
  });
};


exports.index = (req, res) => {
	// Auth info
	var authInfo = req.body.auth;

	// Host info including port number
	var hostInfo = req.body.host;

	// Generate time objects
	var startTime = new Date(req.body.startYear, req.body.startMonth, req.body.startDay, req.body.startHour, req.body.startMinute, req.body.startSecond, req.body.startMillisecond);
	var endTime = new Date(req.body.endYear, req.body.endMonth, req.body.endDay, req.body.endHour, req.body.endMinute, req.body.endSecond, req.body.endMillisecond);
	// Millisecond time difference
	var totalTimeInterval =  endTime.getTime() - startTime.getTime();
	var varTimeInterval = totalTimeInterval / 30;

	// Located in cookies
	var JSESSIONID = req.body.JSESSIONID;
	var XCSRF = req.body.XCSRF; 
	var username = req.body.username;
	var accountName = req.body.accountName;

	var options = {
		method: 'POST',
	  url: 'http://' + hostInfo +'/controller/restui/metricBrowser/getMetricData',
	  headers: 
	  { 
	    'cache-control': 'no-cache',
	    cookie: 'JSESSIONID=' + JSESSIONID + '; X-CSRF-TOKEN=' + XCSRF + '; ad-remember-user=' + username + '; ad-remember-account=' + accountName + '; ad-remember-user-account=true',
	    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
	    referer: 'http://' + hostInfo +'/controller/',
	    origin: 'http://' + hostInfo,
	    host: hostInfo,
	    'content-type': 'application/json;charset=UTF-8',
	    'content-length': '', // Fill with length of body content
	    connection: 'keep-alive',
	    authorization: authInfo,
	    'accept-language': 'en-US,en;q=0.8',
	    'accept-encoding': 'gzip, deflate',
	    accept: 'application/json, text/plain, */*' },
	  	body: '' 
		};

	async.series({
		one: function(callback){
			for (i=0;i<30;i++;){
				var shortEndTime = startTime.getTime + varTimeInterval * i;
				metricBrowserDataRequest(options, startTime, shortEndTime, round(varTimeInterval), function(requestResult){
					callback(null, requestResult);
				});

			}
			metricBrowserDataRequest(options, startTime, endTime, function(){
				callback(null, body);
			});
		}, 
		two: function(callback){

		}
	// Series cb
	}, function (err, results){
		// Catch errors
		if (err){
			return JSON.stringify({'valid':'false', 'msg':err.message});
		}
		// Return processed chart data:
		return results;
	// End of async
	});

// End of exports
};