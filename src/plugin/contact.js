var AliasModel = require( '../model/alias' ).model;

module.exports = function ( schema, options ) {

    schema.static( {
        create : function ( owner, provider, id, data, callback ) {
            var model = this;
            var object = new model( {
                owner : owner
            } );
            return object.save( function ( error, object ) {
                if ( error ) {
                    console.log( error );
                    return callback( error );
                }
                AliasModel.attachContact( object._id, provider, id, data, function ( error, alias ) {
                    if ( error ) {
                        return callback( error );
                    }
                    callback( null, alias );
                } );
            } );
        },
        ensure : function ( owner, provider, id, data, callback ) {
            var model = this;
            AliasModel.read( provider, id, function ( error, result ) {
                if ( error ) {
                    return callback( error );
                }
                if ( !result ) {
                    return model.create( owner, provider, id, data, callback );

                }
                model.count( {
                    _id   : { $in : result.contacts },
                    owner : owner
                }, function ( error, count ) {
                    if ( error ) {
                        return callback( error );
                    }
                    if ( count > 0 ) {
                        return AliasModel.updateThirdPartyData( provider, id, data, callback );
                    }
                    return model.create( owner, provider, id, data, callback );
                } );
            } );
        },
        query  : function ( owner, query, callback ) {
            var found = [];
            var contactIDs = [];
            var that = this;

            that.find( {
                owner : owner
            }, function ( error, list ) {
                if ( error ) {
                    return callback( error );
                }

                function iterate () {
                    var contact = null;
                    if ( (contact = list.shift()) == null ) {
                        return callback( null, found );
                    }
                    contact.export( function ( error, exported ) {
                        found.push( exported );
                        iterate();
                    } );
                };

                iterate();

            } );
        }
    } );

    schema.method( {
        export : function ( callback ) {
            var that = this;
            AliasModel.getAllForContact( that._id, function ( error, list ) {
                if ( error ) {
                    return callback( error );
                }
                callback( null, {
                    id      : that._id,
                    aliases : list
                } );
            } );
        },
    } );

};

