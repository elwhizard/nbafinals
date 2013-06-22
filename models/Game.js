
var db = require('../lib/db');

var GameSchema = new db.Schema({
    scheduleId: db.mongoose.Schema.Types.ObjectId,
    homeTeam: String,
    homeScore: [Number],
    visitorTeam: String,
    visitorScore: [Number],
    status: String
});

var Game = db.mongoose.model('Game', GameSchema);

function addGame(values, callback) {
    Game.collection.update(
        {
            scheduleId: values.scheduleId
        },
        { $set: values},
        {
            upsert: true
        }, function (err, numberAffected, raw) {
            console.log('The number of updated documents was %d', numberAffected);
            console.log('The raw response from Mongo was ', raw);
        });
}

module.exports.Game = Game;
module.exports.addGame = addGame;