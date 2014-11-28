var userPlugin = require( 'mongoose-user' );
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MongooseUserSchema = new Schema( {
    email           : { type : String, default : '' },
    hashed_password : { type : String, default : '' },
    salt            : { type : String, default : '' },
    name            : { type : String, default : '' }
} );

MongooseUserSchema.plugin( userPlugin, {} );
var MongooseUserModel = mongoose.model( 'MongooseUser', MongooseUserSchema );

module.exports = MongooseUserModel;