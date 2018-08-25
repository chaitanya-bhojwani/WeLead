const {mongoose} = require('./mongoose');
const {User} = require('./userSchema');

const getUserByEmail = (email, callback) => {
    User.find({ email }, (err, docs) => {
        if (err) {
            return console.log(err);
        }
        callback(undefined, docs);
    });
};

module.exports = {getUserByEmail};