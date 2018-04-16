/*
 *  Request handlers
 *
 */

// Dependecies
var _data = require('./data');
var helpers = require('./helpers');

// Define the handlers
var handlers = {};

// Ping handler
handlers.ping = function(data, callback){
  callback(200);
}

// Not-Found
handlers.notFound = function(data, callback){
  callback(404);
}

// Users handler
handlers.users = function(data, callback){
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
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
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ?  data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ?  data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ?  data.payload.tosAgreement : false;

  if( firstName && lastName && phone && password && tosAgreement ){
    // Make sure that the user doesn't already exist
    _data.read('users',phone,function(err,data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
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
          callback(500,{'Error':'Could not hash user password'});
        }

      } else {
        // User already exists
        callback(400,{'Error':'A user with that phone number already exists'})
      }
    })
    
  } else {
    callback(400, {'Error':'Missing required fields'}) 
  }
}

// Users - get
// required data: phone
// optional data: none
// @TODO only let authenticated user access their object, dont let them access anyone elses
handlers._users.get = function(data, callback){
  // Check that the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){
    // Lookup the user
    _data.read('users',phone,function(err,rdata){
      if(!err && rdata){
        // Remove the hashed password from the object before returning it to the client
        delete rdata.hashedPassword;
        callback(200,rdata);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error':'Missing valid phone number'});
  }
}
// Users - put
// Required data : phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO only let an authenticated user update their own object, Don't let them update anyone elses
handlers._users.put = function(data, callback){
  // Check for the required field
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for the optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ?  data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ?  data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the phone is invald
  if(phone){
    //Error if nothing is sent to update
    if(firstName || lastName || password){
      // Lookup the user
      _data.read('users',phone,function(err,userData){
        if(!err && userData){
          // Update the field necesary
          if(firstName){
            userData.firstName = firstName;
          }
          if(lastName){
            userData.lastName = lastName;
          }
          if(password){
            userData.hashedPassword = helpers.hash(password);
          }
          // Store the new updataes
          _data.update('users',phone,userData,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not update the user'});
            }
          })
        } else {
          callback(400,{'Error':'The specified user does not exist'});
        }
      });
    } else {
      callback(400,{'Error':'Missing fields to update'});
    }
  } else {
    callback(400,{'Error':'Missing required field'});
  }
}

// Users - delete
// Required fields : phone
// @TODO Only let an authenticated user delete their object. Dont let them delete anyone elses
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = function(data, callback){
  // Check that the phone is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone){
    // Lookup the user
    _data.read('users',phone,function(err,rdata){
      if(!err && rdata){
        _data.delete('users',phone,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500, {'Error' : 'Could not delete the specified user'});
          }
        })
      } else {
        callback(400,{'Error' : 'Could not find the specified user'});
      }
    });
  } else {
    callback(400,{'Error':'Missing valid phone number'});
  }
}

// Tokens
handlers.tokens = function(data, callback){
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data,callback){
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ?  data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if(phone && password){
    // Lookup the user who matches that phone number
    _data.read('users',phone,function(err,userData){
      if(!err && userData){
        // Hash the sent password, and compare it to the password stored in the user object 
        var hashedPassword = helpers.hash(password);
        console.log(':::entered:',hashedPassword);
        console.log(':::user:',userData.hashedPassword);
        if(hashedPassword == userData.hashedPassword){
          // If valid create a new token with a random name. Set expiration date 1 hour in the future
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'phone' : phone,
            'id' : tokenId,
            'expires' : expires,
          };

          // Store token
          _data.create('tokens', tokenId,tokenObject,function(err){
            if(!err){
            callback(200,tokenObject)
            } else {
              callback(500,{'Error' : 'Could not create the new token'});
            }
          });
        } else {
          callback(400,{'Error' : 'Password is incorrect'});
        }
      } else {
        callback(400,{'Error' : 'Could not find the specified user'}); 
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
};

// Tokens - get
handlers._tokens.get = function(data,callback){

};

// Tokens - put
handlers._tokens.put = function(data,callback){

};

// Tokens - delete
handlers._tokens.delete = function(data,callback){

};
// Export handlers
module.exports = handlers;
