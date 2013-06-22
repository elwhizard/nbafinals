
var db = require('../lib/db'),
    mongoose = require('mongoose');

var TeamSchema = new db.Schema({
    team_id: String,
    abbreviation: String,
    active: Boolean,
    first_name: String,
    last_name: String,
    conference: String,
    division: String,
    site_name: String,
    city: String,
    state: String
});

var Team = db.mongoose.model('Team', TeamSchema);

function addTeam(values, callback) {
    var doc = new Team(values);

    // Using mongodb insert for bulk items
    // Mongoose not yet supporting this.
    doc.collection.insert(values, function (err, ins) {
        if (err) {
            console.log('Error on inserting teams');
        } else {
            console.log('Team have been inserted');
        }
    });
}

module.exports.Team = Team;
module.exports.addTeam = addTeam;