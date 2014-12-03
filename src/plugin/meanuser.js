var AliasModel = require( '../model/alias' ).model;

module.exports = function ( schema, options ) {

    schema.post( 'save', function ( user ) {
        var currentAliases = collectAliases(user);
        AliasModel.getAllForUser(user._id, function(err, previousAliases) {
            if(err) return handleError(err);

            previousAliases.forEach(function(oldAlias) {
                var kept = false;
                currentAliases.forEach(function(newAlias) {
                    if(newAlias.id == oldAlias.id && newAlias.provider == oldAlias.provider) {
                        kept = true;
                    }
                });
                if(!kept) {
                    AliasModel.detachUser(user._id, oldAlias.provider, oldAlias.id, handleError);
                }
            });
            currentAliases.forEach(function(newAlias) {
                var wasHere = false;
                previousAliases.forEach(function(oldAlias) {
                    if(newAlias.id == oldAlias.id && newAlias.provider == oldAlias.provider) {
                        wasHere = true;
                    }
                });
                if(!wasHere) {
                    AliasModel.attachUser(user._id, newAlias.provider, newAlias.id, handleError, true);
                }
            });
        });
    } );

    schema.post( 'remove', function ( user ) {
        AliasModel.getAllForUser(user._id, function(err, aliases) {
            if(err) return handleError(err);

            aliases.forEach(function(alias){
                AliasModel.detachUser(user._id, alias.provider, alias.id, handleError);
            })
        });
    } );

    function performAction ( user, action ) {
        action( user._id, AliasModel.EMAIL, user.email, handleError, true );
        action( user._id, AliasModel.USERNAME, user.username, handleError, true );
        if ( user.provider != 'local' ) {
            action( user._id, user.provider, user.providerData.id, handleError, true );
        }
        if ( !user.additionalProvidersData ) return;
        Object.keys( user.additionalProvidersData ).forEach( function ( key ) {
            action( user._id, key, user.additionalProvidersData[ key ].id, handleError, true );
        } );
    }

    function collectAliases ( user ) {
        var aliases = [];
        if ( user.email ) {
            aliases.push( { provider : AliasModel.EMAIL, id : user.email } );
        }
        if ( user.username ) {
            aliases.push( { provider : AliasModel.USERNAME, id : user.username } );
        }
        if ( user.provider != 'local' && user.providerData ) {
            aliases.push( { provider : user.provider, id : user.providerData.id } );
        }
        if ( user.additionalProvidersData ) {
            Object.keys( user.additionalProvidersData ).forEach( function ( key ) {
                aliases.push( { provider : key, id : user.additionalProvidersData[ key ].id } );
            } );
        }
        return aliases;
    }

    function handleError ( err ) {
        if ( err ) {
            throw err;
        }
    }

}