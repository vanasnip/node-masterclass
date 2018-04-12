/*
 *  Request handlers
 *
 */

// Dependecies
var _data = require('./data');
var helpers = require('./helpers');
// Define the handlers
var handlers = {};

// Users handler
handlers.users = function(data, callback){
  var acceptableMathods = ['post', 'get', 'put', 'delete'];
  if(acceptableMathods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for user submethods
handlers._users = {}

// Users - post
// Required data: firstName, lastName, phone, password, tosAggreement
//  Optional data: none
handlers._users.post = function(data, callback){
  // Check that all required field are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ?  data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' &&
    data.payload.lastName.trim().length > 0 ?  data.payload.lastName.trim() : false;

  var phone = typeof(data.payload.phone) == 'string' &&
    data.payload.phone.trim().length == 10 ?  data.payload.phone.trim() : false;

  var password = typeof(data.payload.password) == 'string' &&
    data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' &&
    data.payload.tosAgreement == true ?  data.payload.tosAgreement : false;

  if( firstName && lastName && phone && password && tosAgreement ){
    // Make sure that the user doesn't already exist
    _data.read('users',phone,function(err,data){
      if(err){
        // Hash the password
        var hashPassword = helpers.hash(password);
        console.log(hashPassword);
        if(hashPassword){
          // Create the user object
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'password' : hashPassword,
            'tosAgreement' : true,
          }
          // Store user
          _data.create('users',phone,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error':'Could not create the new user'});
            }
          });
        } else {
          console.log(hashPassword);
          callback(500,{'Error':'Could not hash user password'});
        }
      } else {
        callback(400,{'Error':'A user with that phone number already exists'})
      }
    })
  } else {
    console.log(firstName,lastName,password,tosAgreement); 
    callback(400, {'Error':'Missing required fields'}) 
  }
}

// Users - get
handlers._users.get = function(data, callback){

}

// Users - put
handlers._users.put = function(data, callback){

}

// Users - delete
handlers._users.delete = function(data, callback){

}

// Ping handler
handlers.ping = function(data, callback){
  callback(200);
}

handlers.notFound = function(data, callback){
  callback(404);
}

// Export handlers
module.exports = handlers;
