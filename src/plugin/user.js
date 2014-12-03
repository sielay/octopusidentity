var prequire = require( 'top-require' );
var mongoose = prequire( 'mongoose' );
var Schema = mongoose.Schema;
var crypto = prequire( 'crypto' );
var AliasModel = require( './../model/alias' ).model;
/*!
 * mongoose-alias-user
 * Copyright(c) 2014 Lukasz Sielski <lukaszsielski@gmail.com>
 * MIT Licensed
 */

/**
 * Expose
 */

module.exports = userPlugin;

userPlugin.aliasBindSchema = new Schema( {
    salt  : { type : String, default : null },
    token : { type : String, default : '' },
    auth  : { type : String, default : null }
} );

userPlugin.aliasBind = mongoose.model( 'AliasBinding', userPlugin.aliasBindSchema );

/**
 * User plugin
 *
 * Some common methods and statics to user schema
 *
 * @param {Schema} schema
 * @param {Object} options
 * @api public
 */

function userPlugin ( schema, options ) {
    /**

     var crypto = require('crypto')
     * Authenticate by checking the hashed password and provided password
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api private
     */


    schema.methods.validateCredentials = function ( provider, id, token, callback ) {
        var that = this;
        AliasModel.read( provider, id, function ( err, alias ) {
            if ( err ) {
                return callback( err );
            }
            if ( !alias ) {
                return callback( 'User doesn\'t exists' );
            }
            if ( alias.user != that._id ) {
                return callback( 'Corrupted alias' );
            }
            return that.validateAlias( alias._id, token, callback );
        } );
    };

    schema.methods.validateAlias = function ( aliasId, token, callback ) {
        var found = false;
        var that = this;
        this.accounts.forEach( function ( binding ) {
            if ( binding.auth == aliasId ) {
                found = true;
                var isTokenValid = that.encryptPassword( token, binding.salt ) == binding.token;
                callback( null, isTokenValid );
            }
        } );

        if ( !found ) {
            return callback( 'Alias doesn\'t exists' );
        }
    };

    schema.methods.setAlias = function ( provider, id, password, callback ) {
        var that = this;

        AliasModel.attachUser( this._id, provider, id, onUserAttached );

        function onUserAttached ( err, alias ) {
            if ( err ) {
                return callback( err, null );
            }
            that.attachBinding( alias, password, callback );
        }
    }

    schema.methods.attachBinding = function ( alias, password, callback ) {
        var salt = this.makeSalt();
        var binding = new userPlugin.aliasBind( {
            salt  : salt,
            token : this.encryptPassword( password, salt ),
            auth  : alias._id
        } );
        this.accounts.push( binding );
        this.save( onSave );

        function onSave ( err, object ) {
            if ( err ) {
                console.log(err);
                return callback( err );
            }
            return callback( null, object );
        }
    }

    /**
     * Create password salt
     *
     * @return {String}
     * @api private
     */

    schema.methods.makeSalt = function () {
        return Math.round( (new Date().valueOf() * Math.random()) ) + '';
    }

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api private
     */

    schema.methods.encryptPassword = function ( password, salt ) {
        if ( !password ) return '';
        return crypto.createHmac( 'sha1', salt ).update( password ).digest( 'hex' );
    }

    /**
     * Reset auth token
     *
     * @param {String} token
     * @param {Function} cb
     * @api private
     */

    schema.methods.resetToken = function ( token, cb ) {
        var self = this
        crypto.randomBytes( 48, function ( ex, buf ) {
            self[ token ] = buf.toString( 'hex' )
            if ( cb ) cb()
        } )
    };

    /**
     * Statics
     */

    /**
     * Load
     *
     * @param {Object} options
     * @param {Function} cb
     * @api private
     */

    schema.statics.load = function ( provider, id, callback ) {
        var userModel = this;
        AliasModel.getUser( provider, id, function ( err, userID ) {
            if ( err ) {
                return callback( 'User not found', null );
            }
            userModel.findOne( {
                _id : userID
            }, callback );
        } );
    };

    schema.virtual( 'password' )
        .set( function ( password ) {
            console.warn( 'Password virtual field is deprecated back compatibility with mongoose-user plugin. Please use alias binding instead' );
            this._password = password
            this.salt = this.makeSalt()
            this.hashed_password = this.encryptPassword( password )
        } )
        .get( function () {
            return this._password
        } );

    schema.virtual( 'email' )
        .set( function ( password ) {
            console.warn( 'email virtual field is deprecated back compatibility with mongoose-user plugin. Please use alias binding instead' );
            throw 'Not implemented Email';
        } )
        .get( function () {
            throw 'Not implemented Password';
        } );

}
