var AliasModel = require('../model/alias').model;

module.exports = function ( schema, options ) {

    schema.post('save', function(user) {
        AliasModel.attachUser(user._id, AliasModel.EMAIL, this.email, handleError, true);
        if(this.provider != 'local') {
            AliasModel.attachUser(user._id, this.provider, this.providerData.id, handleError, true);
        }
        if(!this.additionalProvidersData) return;
        Object.keys(this.additionalProvidersData).forEach(function(key) {
            AliasModel.attachUser(user._id, key, user.additionalProvidersData[key].id, handleError, true);
        });
    });

    function handleError(err) {
        if(err) {
            throw err;
        }
    }

}