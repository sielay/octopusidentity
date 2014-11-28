var multiLoginUserPlugin = require( './../../src/plugin/user' );
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OctopusUserSchema = new Schema( {
    name     : { type : String, default : '' },
    accounts : [ multiLoginUserPlugin.aliasBindSchema ]
} );
OctopusUserSchema.plugin( multiLoginUserPlugin, {} );
var OctopusUserModel = mongoose.model( 'OctopusUser', OctopusUserSchema );

module.exports = OctopusUserModel;