var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.mongoose = mongoose;
module.exports.Schema = Schema;

var username = "",
    password = "",
    address = 'localhost';

// Connect to mongo
function connect() {
    var url = 'mongodb://localhost/nbafinals';
    mongoose.connect(url);
}

function disconnect() {
    mongoose.disconnect()
}

connect();
