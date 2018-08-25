var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    fname: {
        type: String,
        required: true,
        minlength: 2
    }, lname: {
        type: String,
        required: true,
        minlength: 2
    }, email: {
        type: String,
        required: true,
        minlength: 2
    }, username: {
        type: String,
        required: true,
        trim: true
    }, pass: {
        type: String,
        required: true,
        minlength: 2
    }, startup: {
        type: String,
        required: true,
        minlength: 2
    }, desc: {
        type: String,
        required: true,
        minlength: 2
    }, detaildesc: {
        type: String,
        required: true,
        minlength: 2
    }, image: {
        type: String
    }
});

var User = mongoose.model('User', userSchema);

module.exports = {User};