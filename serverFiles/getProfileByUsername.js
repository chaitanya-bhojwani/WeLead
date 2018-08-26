const {mongoose} = require('./mongoose');
const {User} = require('./userSchema');

const getProfileByUsername = (username, callback) => {
    User.find({ username }, (err, docs) => {
        if (err) {
            return console.log(err);
        }
        callback(undefined, docs);
    });
};

module.exports = {getProfileByUsername};