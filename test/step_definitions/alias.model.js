/**
 * Module dependencies
 */
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;
var MongooseUserModel = require( './../support/mongooseuser' );
var OctopusUserModel = require( './../support/octopususer' );
var AliasModel = mongoose.model( 'Alias' );

/**
 * Expose
 */
module.exports = function () {

    var createdAliases = [];
    var createdUsers = [];

    var connection = mongoose.connect( 'mongodb://localhost/testoctopusidentity', {
        server : {
            socketOptions : {
                keepAlive : 1
            }
        }
    } );

    this.Given( /^Skip$/, skip );
    this.Given( /^database is empty$/, setUp );
    this.When( /^Skip$/, skip );
    this.When( /^I create (\d+) random aliases$/, createRandomAliases );
    this.When( /^I attach aliases to (\d+) random users$/, attachRandomUsers );
    this.Then( /^I can retrieve them$/, verifyCreatedAliases );
    this.Then( /^I can't save identical$/, verifyUnique );
    this.Then( /^I can retrieve users by aliases$/, retrieveUsersByAliases );
    this.Then( /^I can't attach others users to the same aliases$/, checkUniqueAliasesOnUsers );
    this.Then( /^I can retrieve aliases by users$/, retrieveAliasesByUsers );
    this.Then( /^I can override those aliases$/, overrideUserAliases );

    this.Then( /^Disconnect$/, tearDown );

    function createRandomAliases ( number, callback ) {
        var i = 0;

        function iterate () {
            if ( i >= number ) {
                return callback();
            }
            i++;
            createRandomAlias( iterate );
        }

        iterate.fail = callback.fail;
        iterate();

    }

    function createRandomAlias ( callback ) {

        var provider = (Math.random().toString( 36 ).substring( 7 ));
        var id = (Math.random().toString( 36 ).substring( 7 ));

        var found = false;
        createdAliases.forEach( function ( alias ) {
            if ( alias.id === id && alias.provider === provider ) {
                found = true;
            }
        } );

        if ( found ) {
            return createRandomAlias( callback );
        }

        var alias = new AliasModel( {
            id       : id,
            provider : provider
        } );

        alias.save( function ( err, alias ) {
            if ( err ) {
                return callback.fail();
            }
            createdAliases.push( {
                id       : id,
                provider : provider
            } )
            callback();
        } );
    }

    function verifyCreatedAliases ( callback ) {
        var i = 0;

        function iterate () {
            if ( i >= createdAliases.length ) {
                return callback();
            }
            var model = createdAliases[ i ];
            AliasModel.read( model.provider, model.id, function ( err, alias ) {
                if ( err ) {
                    return callback.fail();
                }
                if ( alias.id !== model.id || alias.provider !== model.provider ) {
                    return callback.fail();
                }
                i++;
                iterate();
            } );
        }

        iterate();
    }

    function verifyUnique ( callback ) {
        var i = 0;

        function iterate () {
            if ( i >= createdAliases.length ) {
                return callback();
            }
            var model = createdAliases[ i++ ];

            var alias = new AliasModel( {
                id       : model.id,
                provider : model.provider
            } );
            alias.save( function ( err, alias ) {
                if ( err ) {
                    return iterate();
                }
                return callback.fail();
            } );
        }

        iterate();
    }

    function attachRandomUsers ( number, callback ) {

        var i = 0;

        function iterate () {
            if ( i >= number ) {
                return callback();
            }
            var user = {
                provider : (Math.random().toString( 36 ).substring( 7 )),
                id       : (Math.random().toString( 36 ).substring( 7 )),
                user     : (Math.random().toString( 36 ).substring( 7 ))
            }

            createdUsers.push( user );
            i++;
            AliasModel.attachUser( user.user, user.provider, user.id, function ( err, alias ) {
                AliasModel.attachUser( user.user, user.provider + '_2', user.id + '_2', function ( err, alias ) {
                    AliasModel.attachUser( user.user, user.provider + '_3', user.id + '_3', iterate );
                } );
            } );
        }

        iterate();
    }

    function retrieveUsersByAliases ( callback ) {

        var i = 0;

        function iterate () {
            if ( i >= createdUsers.length ) {
                return callback();
            }

            var user = createdUsers[ i++ ];
            AliasModel.getUser( user.provider, user.id, function ( err, foundUserID ) {
                if ( err ) {
                    return callback.fail();
                }
                if ( user.user === foundUserID ) {
                    return iterate();
                }
                callback.fail();
            } );
        }

        iterate();
    }

    function checkUniqueAliasesOnUsers ( callback ) {
        var i = 0;

        function iterate () {
            if ( i >= createdUsers.length ) {
                return callback();
            }

            var user = createdUsers[ i++ ];
            AliasModel.attachUser( user.user + '_new_other_user', user.provider, user.id, function ( err, alias ) {
                if ( err ) {
                    return iterate();
                }
                callback.fail();
            } );
        }

        iterate();
    }

    function retrieveAliasesByUsers ( callback ) {
        var i = 0;

        function iterate () {
            if ( i >= createdUsers.length ) {
                return callback();
            }

            var user = createdUsers[ i++ ];
            AliasModel.getAllForUser( user.user, function ( err, aliases ) {
                if ( err ) {
                    return callback.fail();
                }
                if ( !aliases || !(aliases.length) ) {
                    return callback.fail();
                }
                var matching = false;
                aliases.forEach( function ( alias ) {
                    if ( alias.id == user.id && alias.provider == user.provider ) {
                        matching = true;
                        iterate();
                    }
                } );
                if ( !matching ) {
                    return callback.fail();
                }
            } );
        }

        iterate();
    }

    function overrideUserAliases ( callback ) {
        var i = 0;

        function iterate () {
            if ( i >= createdUsers.length ) {
                return callback();
            }

            var user = createdUsers[ i++ ];
            AliasModel.attachUser( user.user + '_new_other_user', user.provider, user.id, function ( err, alias ) {
                if ( err ) {
                    return callback.fail();
                }
                user.user += '_new_other_user';
                iterate();
            }, true );
        }

        iterate();
    }

    function setUp ( callback ) {
        createdAliases = [];
        createdUsers = [];
        AliasModel.remove( {}, callback );
    }

    function skip ( callback ) {
        callback();
    }

    function tearDown ( callback ) {
        try {
            connection.disconnect( function ( err ) {
                if ( err ) {
                    callback.fail();
                }
                conneciton = null;
                callback();
            } );
        } catch ( e ) {
            callback.fail();
        }
    }
}