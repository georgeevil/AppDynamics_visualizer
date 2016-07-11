var request = require("request");
var async = require('async');

/**
 * GET /
 * Visualizer index
 */



// Visualize
exports.viewChart = (req, res) => {
	console.log("View chart");
  res.render('visualizer', {
    title: 'Visualizer'
  });
};

// Call for chart data by ajax
exports.apiCall = (req, res) => {
	// Initate respnse object
	var responseObject = {};
  console.log("api call");
	// Get form data
	// Host info including port number
	var hostInfo = req.body.hostInfo;
	var username = req.body.username;
	var accountName = req.body.accountName;
	var password = req.body.password;
	console.log(JSON.stringify(req.body));
	// Generate time objects
	var startTime = new Date(req.body.startTimeInput);
	var endTime = new Date(req.body.endTimeInput);
	// Total time interval in seconds:
	var totalTimeInterval =  (endTime.getTime() - startTime.getTime())/1000;
	// Divide into 5%s for arbitrary x-axis
	var varTimeInterval = totalTimeInterval / 20;

	// Cuz I got tired of indenting everything :'(
	async.waterfall([
	// Waterfall generates necessary options (primarily headers + body)
	// For actual metric request
    function(callback) {
    	// Authentication key generate from 64 encoding + parsing credentials
			generateAuthKey(username, accountName, password, function(authenticationKey){
        console.log("Auth: " + authenticationKey);
				callback(null, authenticationKey);
			});
    },
    function(authenticationKey, callback) {
    	// Pass on authentication key to authenticating user
    	authenticateUser(authenticationKey, hostInfo, function(cookieString){
        console.log("Cookie string: " + cookieString);
        callback(null, cookieString, authenticationKey);
      });
    },
    function(cookieString, authInfo, callback) {
    	// Do the actual metric browser data request
			authenticatedRequestOptionGen('http://' + hostInfo +'/controller/restui/metricBrowser/getMetricData', hostInfo, cookieString, authInfo, function(generatedOptions){
        console.log("options: " + JSON.stringify(generatedOptions));
				callback(null, generatedOptions);
			});
    }
	], function (err, resultingOptions) {
    console.log("Errors: " + JSON.stringify(err));
		// Catch errors
		console.log(resultingOptions);

		// Process metric browser query response
		// and return as JSON response to API call

		// Response object chart data array of 20 values at 
		// every 5% time interval
		responseObject.chartData = [];

		// Run metric data fetching for every 5%
		async.timesSeries(20, function(i, next) {
			// i is index value
			var shortEndTime = startTime.getTime() + (varTimeInterval * (i+1));
			console.log("Short end time for i:" + i + "; short time:" + shortEndTime);
			metricBrowserDataRequest(resultingOptions, startTime, shortEndTime, Math.round(varTimeInterval), function(requestResult){
				// Add to chart data array
				console.log("Result " + i + ": " + requestResult);
        responseObject.chartData.push(requestResult);
			});

		}, function(err) {
      console.log("Final errosr: " + err);
			// After completing all metric chart data requests
			

		  // Add max value to returned object to gauge maximum value of chart
			responseObject.maxValue = Math.max.apply(Math, responseObject.chartData);
			res.send(JSON.stringify(responseObject));
		});

	});

// End of exports
};


// Update dates string
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

// Generate authentication key for login by base64 encoding a 
// combo of username+accountname+password; transition ex: 
// ez%40customer1:558208121121 -> Basic ZXolNDBjdXN0b21lcjE6NTU4MjA4MTIxMTIx
function generateAuthKey(username, accountname, password, cb){
	var authenticationKey = new Buffer(username + "%40" + accountname + ":" + password).toString('base64');
	cb(authenticationKey);
}

// Generate authenticated request options
function authenticatedRequestOptionGen(url, hostInfo, cookieString, authInfo, cb){
	var options = {
		method: 'POST',
	  url: url,
	  headers: 
	  { 
	    'cache-control': 'no-cache',
	    cookie: cookieString,
	    referer: 'http://' + hostInfo +'/controller/',
	    origin: 'http://' + hostInfo,
	    host: hostInfo,
	    'content-type': 'application/json;charset=UTF-8',
	    'content-length': '', // Fill with length of body content
	    connection: 'keep-alive',
	    authorization: 'Basic ' + authInfo,
	    'accept-language': 'en-US,en;q=0.8',
	    'accept-encoding': 'gzip, deflate',
	    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // Supposedly bad but meh idgaf
	    accept: 'application/json, text/plain, */*' 
	  },
	  body: '' 
	};
	cb(options);
}

// Authenticate user via login request, returns necessary _ga, jsessionid, 
// csrf, and connectsid cookies for authenticating later requests
function authenticateUser(authenticationKey, host, cb){
	// Prepare for request
	var options = { 
		method: 'GET',
	  url: 'http://' + host + '/controller/auth',
	  qs: { action: 'login' },
	  // Develop special headers for pre-authorization connections
	  headers: 
	  { 
	    'cache-control': 'no-cache',
	    authorization: 'Basic ' + authenticationKey, 
	    cookie: 'JSESSIONID=lmaolmao;', // Random, hopefully this works?
	    'accept-language': 'en-US,en;q=0.8',
	    'accept-encoding': 'gzip, deflate, sdch',
	    referer: 'http://' + host + '/controller/',
	    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // Supposedly bad but meh idgaf
	    accept: 'application/json, text/plain, */*',
	    connection: 'keep-alive',
	    host: host
	  } 
	};

	// Send out request
	request(options, function (error, response, body) {
		// Ples no
		console.log("Err: " + error);
	  // Get the cookies
	 	var setCookieList = [];
	  response.headers["set-cookie"].forEach(
	    function ( cookiestr ) {
	    	// Parse the cookies (sometimes jsessionid cookie will have extraneous 
	    	// text at the end of it, so we get rid of the extra part if necessary)
	    	if (cookiestr != "HttpOnly"){
	    		setCookieList.push(cookiestr.replace('Path=/controller;','').replace('HttpOnly',''));
	    	}
	    	
	    	
	    }
	  );

	  var setCookies = setCookieList.join("; "); 
	  // Returns cookie header string
	  cb(setCookies.replace(';  ;',';'));
	});
}



// Send request for metric browser chart data, across a set time interval
// returns a single data value for a short time interval that is used for plotting
function metricBrowserDataRequest(options, startTime, endTime, timeInterval, callback){
	// Metric chart data specifications

	// Arbitrary, need to update
	var metricId = 1237; // Type of request
	var entityId = 5; // User info?

	// Build start and end time strings
	// EX "2016-07-10T06:08:00.000Z"
	var startTimeObj = new Date(startTime);
	var startTimeString = 
		startTimeObj.getFullYear() + "-" + 
		addZero(startTimeObj.getMonth()) + "-" + 
		addZero(startTimeObj.getDay()) + "T" + 
		addZero(startTimeObj.getHours()) + ":" + 
		addZero(startTimeObj.getMinutes()) + ":" +
		addZero(startTimeObj.getSeconds()) + ".000Z";
	var endTimeObj = new Date(endTime);
	var endTimeString = 
		endTimeObj.getFullYear() + "-" + 
		addZero(endTimeObj.getMonth()) + "-" + 
		addZero(endTimeObj.getDay()) + "T" + 
		addZero(endTimeObj.getHours()) + ":" + 
		addZero(endTimeObj.getMinutes()) + ":" +
		addZero(endTimeObj.getSeconds()) + ".000Z";

	// Build JSON body for metric request
	options.body = '{"metricDataQueries":[{"metricId":' + metricId + ',"entityId":' + entityId + ',"entityType":"APPLICATION"}],"timeRangeSpecifier":{"type":"BETWEEN_TIMES","startTime":"' + startTimeString + '","endTime":"' + endTimeString + '","durationInMinutes":' + Math.ceil(timeInterval) + '},"metricBaseline":null,"maxSize":3000}';

	// Get length of metric request 
	options.headers["content-length"] = options.body.length; // Get string length function

	// Send it out!

	console.log("Final options:" + JSON.stringify(options));
	request(options, function (error, response, body) {
		console.log(JSON.toString(body));
		var parsedResp = JSON.parse(body);
		// We only want to grab a single slice of data
		// because we already narrowed down the time interval 
		var timeStamp = parsedResp[0].dataTimeslices[0].startTime;
		var value = parsedResp[0].dataTimeslices[0].metricValue.value;
	  callback({"time": timeStamp, "value": value});
	});
}


