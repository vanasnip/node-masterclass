/*
 * Primary file for the API
 *
 */

//Dependencies 
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// Instantiating the HTTP server
var httpServer = http.createServer(function(req,res){
  unifiedServer(req,res);
});

// Start httpServer from port in config
httpServer.listen(config.httpPort,function(){
  console.log('The server is listening on port '+config.httpPort+' in ::'+config.envName.toUpperCase()+':: mode');
});

// Instantiate the HTTPs server
var httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions,function(req,res){
  unifiedServer(req,res);
});
// Start the HTTPS server
httpsServer.listen(config.httpsPort,function(){
  console.log('The server is listening on port '+config.httpsPort+' in ::'+config.envName.toUpperCase()+':: mode');
});

// All the server logic for both the http and https server
var unifiedServer = function(req, res){

  //Get the url and parse it 
  var parsedUrl = url.parse(req.url,true); 

  //Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g,'');

  // Get the query string as an object 
  var queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  var method = req.method.toLowerCase();

  // Get the headers as an object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data){
    buffer += decoder.write(data);
  });

  req.on('end', function(){
    buffer += decoder.end();

    // Choose the handler this request should go to, if one is not found use the not found handler
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound; 

    //Construct the data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    };

    // Router the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload){
      // Use the status cose called back by the handler or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // use the payload called back by the handler, or default to an empty function
      payload  = typeof(payload) == 'object' ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Retrun the response
      res.setHeader('Content-Type','application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Returning this response: ', statusCode, payloadString);
    });
    // Log the request path
    //console.log('Request received with this payload:', buffer,'|headers:', headers);
  });
};

// Define the handlers
var handlers = {};

// Ping handler
handlers.ping = function(data, callback){
  callback(200);
}

handlers.notFound = function(data, callback){
  callback(404);
}

// Define a request router
var router = {
  'ping': handlers.ping,  
}


