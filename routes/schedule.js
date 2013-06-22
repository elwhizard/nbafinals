
var http = require('http'),
    nbaFinals = require('../lib/nbaFinalsLib'),
    teamSchema = require('../models/Team'),
    scheduleSchema = require('../models/Schedule'),
    $ = require('cheerio');

// PRIVATES

function formatSchedule(arr) {
    var scheduleArr = [];
    var j = 0;

    arr.forEach(function (el) {

        var schedDate = new Date(el.playDate - 18000000);

        var days = nbaFinals.daysName(),
            months = nbaFinals.monthsName();

        function getHour (hour) {
            if (hour > 11) {
                return (hour - 11) + ' PM';
            } else {
                return hour + ' AM';
            }
        }

        scheduleArr[j] = {
            site: el.team,
            score: el.score,
            seriesStanding: el.seriesStanding,
            datePretty: days[schedDate.getUTCDay()] + ' ' + months[schedDate.getUTCMonth()] +  ' ' + schedDate.getUTCDate(),
            hour: getHour(schedDate.getUTCHours())
        };

        j += 1;

    });

    return scheduleArr;
}

function getScheduleFromCbs (callback) {
    var options = {
            hostname: 'www.cbssports.com',
            port: 80,
            path: '/nba/playoffs',
            method: 'GET'
        };

    var req = http.request(options, function(res) {
        var body = '';

        res.on("data", function(chunk){
            body += chunk.toString('utf8');
        });

        res.on("end", function(){
            var parsedHTML = $.load(body);

            var arrayData = parsedHTML('table.data tr').map(function(i, row) {
                var tdArr = [];
                var c;
                // Get each td
                var tdEl = $(row).children('td');

                for (c in tdEl) {
                    if (tdEl.hasOwnProperty(c)) {
                        tdArr[tdArr.length] = $(tdEl[c]).text();
                    }
                }
                return tdArr;
            });

            // Let's remove the header and footer
            arrayData = arrayData.slice(1, -1);

            prepareSchedules(arrayData, callback);
        });
    });

    req.end();

}

function prepareSchedules (schedArr, callback) {
    var schedForTable = [],
        teamsNameArr = [],
        teamsDocObj = {},
        year = new Date().getFullYear(),
        i;

    for (i = 0; i < schedArr.length; i++) {
        // This will get the 2 playing teams
        teamsDocObj[schedArr[i][2]] = schedArr[i][2];
        schedForTable[i] = {
            team: schedArr[i][2],
            playDate: Date.parse(schedArr[i][0] + ', ' + year + ' ' + (parseInt(schedArr[i][1], 10) + 12) + ':00:00 GMT-0400'),
            year: year,
            gameNum: i + 1,
            score: schedArr[i][4],
            seriesStanding: schedArr[i][5]
        }
    }

    // Now let's get the 2 playing teams from the teams table
    teamsNameArr = Object.keys(teamsDocObj);
    i = 0;
    teamsNameArr.forEach(function (team) {
        teamsDocObj[team] = teamSchema.Team.findOne({city: team}, function (err, doc) {
            i += 1;
            teamsDocObj[team] = doc;
            if (i === teamsNameArr.length) {
                prepareSchedules_forTable(teamsDocObj, schedForTable, callback);
            }
        });
    });


}

function prepareSchedules_forTable (teamsDocObj, schedForTable, callback) {

    // Add the team object id
    var teamsNameArr = Object.keys(teamsDocObj),
        i;

    for (i = 0; i < schedForTable.length; i++) {
        if (teamsNameArr[0] === schedForTable[i].team) {
            schedForTable[i].homeTeam = teamsDocObj[schedForTable[i].team]._id;
            schedForTable[i].visitorTeam = teamsDocObj[teamsNameArr[1]]._id;
        }

        if (teamsNameArr[1] === schedForTable[i].team) {
            schedForTable[i].homeTeam = teamsDocObj[schedForTable[i].team]._id;
            schedForTable[i].visitorTeam = teamsDocObj[teamsNameArr[0]]._id;
        }

    }

    scheduleSchema.addSchedule(schedForTable);

}

function getSchedules (callback) {
    var Schedules = scheduleSchema.Schedule,
        Teams = teamSchema.Team;

    // Let's check first if we have teams in our team collection
    Teams.findOne(function (err, team) {
        if (!err) {
            if (!team) {
                nbaFinals.getTeamsFromApi();
                callback(false);
            } else {
                // Proceed to getting the Schedules
                Schedules.find({year: 2013}, {}, {sort: {playDate: 1}}, function (err, docs) {
                    if (!err) {
                        if (docs.length) {
                            callback(docs);
                        } else {
                            // We need to get our schedules from CBS
                            getScheduleFromCbs();
                            callback(false);
                        }
                    }
                });
            }
        } else {
            callback(false);
        }
    });
}

// EXPORT

exports.getSchedules = function (req, res) {
    getSchedules(function (scheduleArr) {
        if (scheduleArr) {
            res.json(formatSchedule(scheduleArr));
        } else {
            res.json([{results: 0}])
        }
    });
}