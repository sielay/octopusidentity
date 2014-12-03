octopusidentity
===============

```
npm install octopusidentity
```

Passport + mongoose middle ware to manage multiple identity users and non-user contacts without redundancy and conflicts.

It may be usefull as long you try to solve ALL listed challanges:

* you use Passport
* your users can use multiple emails
* your users can authorise with oauth strategies
* your users can have contacts who can be identified either by email and social accounts
* contacts may be users in your system, but doesn't have to be

## Usage with MeanJS

### Main reason to use with MeanJS

MeanJS saves various identities in few fields:
 * user.email
 * user.username
 * user.providerData.id
 * user.additionalProviderData[providerName].id
 
As we know Mongo is quite rubbish, if you want to create multiple indexes on collection (very space consuming). For that case we gather all data in "shadow" collection called aliases witch such schema:

```
var AliasSchema = new Schema( {
    id       : { type : String },
    provider : { type : String },
    user     : { type : String, default : null },
    contacts : [ { type : String } ]
} );
```

Thanks to that you can simplify queries to maximum 3 indexes:
	* id+provider
	* user
	* contact

### Installation

For MeanJS simply plugin MeanJS User Plugin into your user model

```
var octopus = require('octopusidentity' ).meanPlugin;
(...)
UserSchema.plugin(octopus);
```

All happens behind the scenes and OctopusIdentity shadows native MeanJS authentification. It also works asynchronous so won't affect user experience.

## Usage with Passport

For Passport please use User Plugin.

```
var UserPlugin = require( 'octopusidentity' ).plugin;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema( {
    name     : { type : String, default : '' },
    accounts : [ UserPlugin ]
} );
OctopusUserSchema.plugin( UserPlugin, {} );
mongoose.model( 'User', UserSchema );
```

This user plugin has slightly different internface to mongoose-user User Plugin, as it base more on the callbacks.

To fetch user:

```
/**
  * @param {String} provider - email, facebook or other strategy name
  * @param {String} id - oauth id or email
  */
UserModel.load( provider, id , function ( err, user ) {
	(...)
});
```

To verify credentials

```
/**
  * @param {Boolean} successOrFail
  */
user.validateCredentials( provider, id, tokenOrPassword, function(err, successOfFail) {
   (...)
});
```

To assign credentials


```
user.setAlias(provider, id, tokenOrPassword, function(err, user) {
});
```

## Planned features

 * Collect graph data from providers (useful for contacts). Use Gmail Contacts use case. If you have johndoe@gmail.com in you contacts Gmail will fill info about him (including avatar) with G+ data. You can override it, but your changes appear only for you. If johndoe changes his data on G+ all non-overriden data should be updated. It has sense to store data in such structure:
 
	```
{
    provider : "google",
	id : "johndoe@gmail.com",
	user : null // he is not yet a user
	contacts : [ 'someMongoID', 'someMongoID2' ],
	data : {
		thumb : 'http://example.com/my_smiley_avatar.png',
		displayName : 'John Doe'
	}
}
```

## Test status

Tested with strategies:

* google
* github
* linkedin
* facebook
* twitter
* vk

Tested with MEANJS.Org

Project that is decoupted part of code I work at in my free time.

## Credits

* Lukasz Sielski [email address](mailto:lukaszsielski@gmail.com) [web site](http://www.lukaszsielski.pl) [github](https://github.com/sielay)

Licenced under MIT, of course.