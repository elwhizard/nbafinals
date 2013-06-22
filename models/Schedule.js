
var db = require('../lib/db');

var ScheduleSchema = new db.Schema({
    homeTeam: db.mongoose.Schema.Types.ObjectId,
    visitorTeam: db.mongoose.Schema.Types.ObjectId,
    team: String,
    playDate: Number,
    year: Number,
    gameNum: Number,
    score: String,
    seriesStanding: String
});

var Schedule = db.mongoose.model('Schedule', ScheduleSchema);

function addSchedule(values) {
    values.forEach(function (schedule) {
        Schedule.collection.update(
            {
                year: schedule.year,
                playDate: schedule.playDate
            },
            { $set: schedule},
            {
                upsert: true
            }, function (err, numberAffected, raw) {
                console.log('The number of updated documents was %d', numberAffected);
                console.log('The raw response from Mongo was ', raw);
            });
    });
}

function getSchedule(date, callback) {

}

module.exports.Schedule = Schedule;
module.exports.addSchedule = addSchedule;

// Exports