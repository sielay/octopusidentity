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

    var usedModel = null;
    var connection = null;
    var createdUsers = [];
    var i = 0;

    connection = mongoose.connect( 'mongodb://localhost/testoctopusidentity', {
        server : {
            socketOptions : {
                keepAlive : 1
            }
        }
    } );

    var kinds = [
        AliasModel.EMAIL,
        AliasModel.FACEBOOK,
        AliasModel.GITHUB,
        AliasModel.LINKEDIN,
        AliasModel.VK,
        AliasModel.TWITTER
    ];

    this.Given( /^Skip$/, skip );
    this.Given( /^database is clean$/, setUp );
    this.When( /^I create user by (.+) (.+) and (.+) (password|token) using (.+) plugin$/, iCreateUser );
    this.When( /^Skip$/, skip );
    this.When( /^^I create (\d+) random (.+) users$/, createRandomUsers );
    this.When( /^I create (\d+) random users each kind$/, createRamdomUsersEachKind );
    this.Then( /^I can(|'t) authorise user with (.+) (.+) and (.+) (password|token)$/, iAuthoriseUser );
    this.Then( /^I can(|'t) authorise each user with (in|)valid credentials$/, iAuthoriseEachUser );
    this.Then( /^I can't authorise each user with other credentials$/, crossCredentialsTest );
    this.Then( /^Disconnect$/, tearDown );

    /**
     * Implementations
     */

    function setUp ( callback ) {
        userModel = null;

        createdUsers = [];

        AliasModel.remove( {}, stepTwo );

        function stepTwo () {
            MongooseUserModel.remove( {}, stepThree );
        };

        function stepThree () {
            OctopusUserModel.remove( {}, stepFour );
        }

        function stepFour () {
            callback();
        }

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

    function createRamdomUsersEachKind ( number, callback ) {

        var i = 0;

        function iterate () {
            if ( i < kinds.length ) {
                createRandomUsers( number, kinds[ i++ ], iterate );
            } else {
                callback();
            }
        }

        iterate.fail = callback.fail;

        iterate();

    }

    function createRandomUsers ( number, provider, callback ) {

        var i = 0;

        function createAnother () {
            var user = {
                    provider : provider,
                    id       : (Math.random().toString( 36 ).substring( 7 )) + (provider == 'email' ? '@example.com' : ''),
                    token    : (Math.random().toString( 36 ).substring( 8 ))
                }
                ;
            if ( userAlreadyCreated( user ) ) {
                return createAnother();
            }

            function onAnotherCreated () {
                createdUsers.push( user );
                if ( ++i >= number ) {
                    return callback();
                }
                return createAnother();
            }

            onAnotherCreated.fail = function ( err ) {
                console.error( err );
                callback.fail();
            }

            iCreateUser( user.provider, user.id, user.token, '', 'octopus', onAnotherCreated );
        }

        function userAlreadyCreated ( newUser ) {
            var exists = false;
            createdUsers.forEach( function ( user ) {
                if ( user.id == newUser.id ) {
                    exists = true;
                }
            } );
            return exists;
        }

        createAnother();

    }

    function iCreateUser ( provider, id, token, tokenName, plugin, callback ) {

        if ( plugin == 'mongoose' ) {
            return iCreateMongooseUser( id, token, saveCallback );
        }

        iCreateOctopusUser( provider, id, token, saveCallback );

        function saveCallback ( err ) {
            if ( err ) {
                return callback.fail();
            }
            callback();
        }
    }

    function iCreateMongooseUser ( id, token, callback ) {
        usedModel = MongooseUserModel;
        (new MongooseUserModel( {
            name     : id,
            email    : id,
            password : token
        } )).save( callback );
    }

    function iCreateOctopusUser ( provider, id, token, callback ) {
        usedModel = OctopusUserModel;
        (new OctopusUserModel( {
            name : id
        } )).save( function ( err, user ) {
                user.setAlias( provider, id, token, callback );
            } );
    }

    function crossCredentialsTest ( callback ) {
        var i = 0;

        function iterate () {

            if ( i >= createdUsers.length ) {
                return callback();
            }

            var user = createdUsers[ i ];
            var j = 0;

            function innerIterate () {

                if ( j == i ) {
                    j++;
                    return innerIterate();
                }

                if ( j >= createdUsers.length ) {
                    i++;
                    return iterate();
                }

                var token = createdUsers[ j ].token;

                j++;

                iAuthoriseUser( '\'t', user.provider, user.id, token, '', innerIterate );

            }

            innerIterate.fail = callback.fail;

            innerIterate();
        }

        iterate.fail = callback.fail;

        iterate();
    }

    function iAuthoriseEachUser ( condition1, condition2, callback ) {

        var i = 0;

        function iterate () {
            if ( i >= createdUsers.length ) {
                return callback();
            }
            var j = i;
            var token = createdUsers[ j ].token;

            if ( condition2 == 'in' ) {
                token = token + '_invalid';
            }

            i++;

            iAuthoriseUser( condition1, createdUsers[ j ].provider, createdUsers[ j ].id, token, '', iterate );
        }

        iterate.fail = callback.fail;

        iterate();

    }

    function iAuthoriseUser ( condition, provider, id, token, tokenName, callback ) {

        if ( usedModel == MongooseUserModel ) {
            usedModel.load( { criteria : { email : id } }, postLoad );
        } else {
            usedModel.load( provider, id, postLoad );
        }

        function found () {
            if ( condition == '' ) {
                callback();
            } else {
                callback.fail();
            }
        }

        function error () {
            if ( condition != '' ) {
                callback();
            } else {
                callback.fail();
            }
        }

        function postLoad ( err, user ) {
            if ( err ) return error();
            if ( !user ) {
                return error();
            }
            if ( user.authenticate ) {
                var authorised = user.authenticate( token );
                return (authorised ? found : error)();
            }
            user.validateCredentials( provider, id, token, postValidate );
        };

        function postValidate ( err, result ) {
            if ( err ) {
                return error( err );
            }
            if ( result ) {
                return found();
            }
            return error();
        }

    }
};