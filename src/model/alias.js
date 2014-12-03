/**
 * Module dependencies
 */
var prequire = require( 'top-require' );
var mongoose = prequire( 'mongoose' );
var extend = require( 'util' )._extend;
var Schema = mongoose.Schema;

/**
 * Schema
 */
var AliasSchema = new Schema( {
    id          : { type : String },
    provider    : { type : String },
    user        : { type : String, default : null },
    contacts    : [ { type : String } ],
    displayName : { type : String },
    thumbnail   : { type : String }
} );

AliasSchema.static( {
    USERNAME             : 'username',
    EMAIL                : 'email',
    FACEBOOK             : 'facebook',
    GITHUB               : 'github',
    LINKEDIN             : 'linkedin',
    VK                   : 'vk',
    TWITTER              : 'twitter',
    read                 : read,
    getUser              : getUser,
    getContact           : getContact,
    getOwners            : getOwners,
    getAllForUser        : getAllForUser,
    getAllForContact     : getAllForContact,
    attachUser           : attachUser,
    detachUser           : detachUser,
    attachContact        : attachContact,
    detachContact        : detachContact,
    isUsedForUser        : isUsedForUser,
    isUsedForContact     : isUsedForContact,
    updateThirdPartyData : updateThirdPartyData
} );

AliasSchema.pre( 'save', validateBeforeSave );

AliasModel = mongoose.model( 'Alias', AliasSchema );

/**
 * Expose
 */
module.exports = {
    schema : AliasSchema,
    model  : AliasModel
};

/**
 * Universal method to get ONE alias by provider and id
 * @param provider
 * @param id
 * @param callback
 * @param errback
 */
function read ( provider, id, callback ) {
    AliasModel.findOne( {
        provider : provider,
        id       : id
    }, function ( err, object ) {
        if ( err ) {
            return callback( err, null );
        }
        callback( null, object );
    } );
}

function getUser ( provider, id, callback ) {

    read( provider, id, function ( err, model ) {
        if ( model ) {
            callback( null, model.user ); //TODO: test if that is user
        } else {
            callback( 'Alias not found', null );
        }
    } );
}

function getContact ( provider, id, owner, callback ) {
    read( provider, id, function ( err, object ) {
        if ( err ) {
            return callback( err, null );
        }
        var found = false;
        object.contacts.forEach( function ( contact ) {
            if ( contact.owner == owner ) {
                callback( null, contact );
            }
        } );
        if ( !found ) {
            callback( null, null );
        }
    }, errback );
}

function getOwners ( provider, id, callback ) {
    //TODO: use one callback like used else where

}

function getAllForUser ( userID, callback ) {
    AliasModel.find( {
        user : userID
    }, function ( err, aliases ) {
        if ( err ) {
            return callback( err, null );
        }
        callback( null, aliases );
    } );
}

function getAllForContact ( contactID, callback ) {
    AliasModel.find( {
        contacts : contactId
    }, function ( err, aliases ) {
        if ( err ) {
            return callback( err, null );
        }
        callback( null, aliases );
    } );
}

function attachUser ( user, provider, id, callback, force ) {
    read( provider, id, function ( err, model ) {
        if ( err ) {
            return callback( err, null );
        }
        if ( !model ) {
            model = new AliasModel();
            model.id = id;
            model.provider = provider;
        }

        if ( model.user == user ) {
            return callback( null, model );
        }

        if ( model.user && !force ) {
            return callback( 'Alias already attach to some user', null );
        }
        model.user = user;
        model.save( function ( err, data ) {
            if ( err ) {
                return callback( err, null );
            }
            callback( null, data );
        } );

    } );
};

function detachUser ( provider, id, callback ) {

    read( provider, id, function ( err, model ) {
        if ( err ) {
            callback( err, null );
        }
        if ( model ) {
            model.user = null;
            model.save( function ( err, model ) {
                if ( err ) {
                    return callback( err, null );
                }
                return callback( null, model );

            } );
        } else {
            return callback( null, null );
        }
    } );
}

function attachContact ( contact, provider, id, callback ) {

}

function detachContact ( contact, provider, id, callback ) {

}

function isUsedForUser ( provider, id, positive, negative ) {
    AliasModel.count( {
            provider : provider,
            id       : id,
            user     : {
                $ne : null
            }
        }, function ( err, count ) {
            if ( err ) {
                return negative( err );
            }
            if ( count > 0 ) {
                return positive();
            }
            return negative();

        }
    );
}

function isUsedForContact ( owner, provider, id, positive, negative ) {
    read( provider, id, function ( err, alias ) {
        if ( alias.contacts && alias.contacts.length > 0 ) {
            //TODO: inject contact
            //TODO: change interface of the method to one callback
            negative();
        } else {
            negative();
        }
    }, negative );
}

function updateThirdPartyData ( provider, id, data, callback ) {
    read( provider, id, function ( err, alias ) {
        if ( err ) {
            return callback( err );
        }
        extend( alias, data );
        alias.save( callback );
    } );
}

function validateBeforeSave ( next ) {
    var that = this;
    read( that.provider, that.id, function ( err, alias ) {
        if ( err ) {
            return next( err );
        }

        if ( !!alias && that._id + '' !== alias._id + '' ) {
            next( new Error( 'Alias already defined' ) );
        }
        next();
    } );
}