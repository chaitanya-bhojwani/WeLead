var {mongoose} = require('./mongoose');
var {User} = require('./userSchema');

var addUser = (userDoc, callback) => {
    var user = new User(userDoc);
    user.save().then((doc) => {
        console.log(doc);
        return callback(undefined, doc);
    }, (e) => {
        return callback(e);
    });
};

module.exports = {addUser};