'use strict';

var https = require('https'),
    http = require('http'),
    xml2js = require('xml2js'),
    teamSchema = require('../models/Team'),
    scheduleSchema = require('../models/Schedule'),
    gameSchema = require('../models/Game');

// PRIVATES
function queryLatestGame (callback) {
    var schedule = scheduleSchema.Schedule;
    // Current Eastern Time
    var currentTimeET = Date.now() - 18000000;

    // Get scores from API
    // Query the schdules collection
    var qs = schedule.find({year: getYear(), playDate: {'$lte': currentTimeET}}).sort({playDate: -1}).limit(1);

    qs.execFind(function (err, doc) {
        if (!err) {
            var schedule = doc[0];
            // Found a schedule
            // Let's query the games collection

            // Check if game is playing
            // Adding 4.5 hours to the game time
            if (schedule.playDate <= currentTimeET && currentTimeET <= (schedule.playDate + 16200000)) {
                getLiveGame(schedule, callback);
            } else {
                getGame(schedule, callback);
            }
        } else {
            callback(false);
        }
    });
}

function getLiveGame (schedule, callback) {

    var options = {
        hostname: 'scores.nbcsports.msnbc.com',
        port: 80,
        path: '/ticker/data/gamesMSNBC.js.asp?jsonp=true&sport=NBA&period=' + 20130620,
        method: 'GET'
    };

    var req = http.request(options, function(res) {
        var body = '';

        res.on("data", function(chunk){
            body += chunk.toString('utf8');
        });

        res.on("end", function(){
            // Let's get only the xml parts of the returned data
            var gameInfo = body.match(/<ticker-entry((.|\s)*)ticker-entry>/gmi);
            gameInfo = gameInfo[0];
            gameInfo = gameInfo.replace(/\\"/gmi, '"');
            // Convert to JSON
            var parseString = xml2js.parseString;
            parseString(gameInfo, function (err, res) {
                var homeTeam = res['ticker-entry']['home-team'][0],
                    visitingTeam = res['ticker-entry']['visiting-team'][0],
                    gameStatus = res['ticker-entry'].gamestate[0]['$'].status;

                var homeTeamScore = [];

                homeTeam['score'].forEach(function (el) {
                    // Don't add to array if total
                    if (el['$'].heading !== 'T') {
                        homeTeamScore.push(el['$'].value);
                    }
                });

                var visitingTeamScore = [];
                visitingTeam['score'].forEach(function (el) {
                    // Don't add to array if total
                    if (el['$'].heading !== 'T') {
                        visitingTeamScore.push(el['$'].value);
                    }
                });

                var gameUpdates = [{
                    team: homeTeam['$'].display_name + ' ' + homeTeam['$'].nickname,
                    scores: homeTeamScore,
                    status: gameStatus
                }, {
                    team: visitingTeam['$'].display_name + ' ' + visitingTeam['$'].nickname,
                    scores: visitingTeamScore,
                    status: gameStatus
                }]

                // If it's end of the game,
                // Then add data to collection
                if (gameStatus === 'Final') {

                    var gameDoc = {
                        scheduleId: schedule._id,
                        homeTeam: homeTeam['$'].display_name,
                        homeScore: homeTeamScore,
                        visitorTeam: visitingTeam['$'].display_name,
                        visitorScore: visitingTeamScore,
                        status: 'Final'
                    }

                    // Add game to collection
                    gameSchema.addGame(gameDoc, function () {

                    });
                }

                callback(gameUpdates)
            });
        });
    });

    req.end();

}

function getGame (schedule, callback) {
    var game = gameSchema.Game;

    game.find({scheduleId: schedule._id}, function (err, doc) {
        if (!err) {
            if (doc.length) {
                var game = doc[0];
                callback([{
                    team: game.homeTeam,
                    status: game.status,
                    scores: game.homeScore
                }, {
                    team: game.visitorTeam,
                    status: game.status,
                    scores: game.visitorScore
                }])
            } else {
                getGameHistory(schedule);
            }
        } else {
            callback(false);
        }
    });


}

// We're getting game history from erikberg.com
function getGameHistory (schedule) {
    getTeam({_id: {$in: [schedule.homeTeam, schedule.visitorTeam]}}, function (docs) {
        if (docs.length) {
            getGameHistoryFromApi(docs, schedule);
        }
    });
}

function getGameHistoryFromApi (teams, schedule) {
    var awayTeam, awayTeamDoc, homeTeam, homeTeamDoc, playDate;

    if (schedule.team === teams[0].first_name) {
        homeTeam = teams[0].first_name + '-' + teams[0].last_name;
        awayTeam = teams[1].first_name + '-' + teams[1].last_name;
        homeTeamDoc = teams[0];
        awayTeamDoc = teams[1];
    } else {
        homeTeam = teams[1].first_name + '-' + teams[1].last_name;
        awayTeam = teams[0].first_name + '-' + teams[0].last_name;
        homeTeamDoc = teams[1];
        awayTeamDoc = teams[0];
    }

    homeTeam = homeTeam.replace(/[\s]/g, '-').toLowerCase();
    awayTeam = awayTeam.replace(/[\s]/g, '-').toLowerCase();

    // Let's get our date in ET time and format it
    playDate = new Date(schedule.playDate - 18000000);
    playDate = playDate.toISOString();
    playDate = playDate.replace(/^(\d{4})\-(\d{2})\-(\d{2}).*$/g, '$1$2$3')

    var options = {
            hostname: 'erikberg.com',
            path: '/nba/boxscore/'+ playDate +'-'+ awayTeam +'-at-'+ homeTeam +'.json',
            method: 'GET'
        };

    var req = https.request(options, function(res) {
        var body = '';

        res.on("data", function(chunk){
            body += chunk.toString('utf8');
        });

        res.on("end", function(){
            var gameJson = JSON.parse(body),
                gameDoc;

            gameDoc = {
                scheduleId: schedule._id,
                homeTeam: homeTeamDoc.first_name,
                homeScore: gameJson.home_period_scores,
                visitorTeam: awayTeamDoc.first_name,
                visitorScore: gameJson.away_period_scores,
                status: 'Final'
            }

            // Add game to collection
            gameSchema.addGame(gameDoc, function () {

            });

        });
    });

    req.end();
}

function getTeamsFromApi (callback) {
    var options = {
        host: 'erikberg.com',
        path: '/nba/teams.json',
        method: 'GET'
    }

    var request = https.request(options, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk.toString('utf8');
        });
        res.on('end', function () {
            var teams = JSON.parse(body);
            addTeamsToTable(teams, callback);
        });
    });

    request.end();
}

function addTeamsToTable (values, callback) {
    teamSchema.addTeam(values, callback);
}

function getTeam (queryObj, callback) {
    teamSchema.Team.find(queryObj, function (err, docs) {
        if (!err) {
            callback(docs);
        }
    });
}

function formatGameUpdates (arr) {
    var gameUpdates = [],
        i = 0;

    arr.forEach(function (el) {
        var j = 1, total = 0;
        gameUpdates[i] = {};
        el.scores.forEach(function (el) {
            el = parseInt(el, 10);
            if (j <= 4) {
                // Create each game quarter score
                gameUpdates[i]['q'+j] = el;
            }
            total += el;
            j += 1;
        });

        if (el.status === 'Final') {
            gameUpdates[i].total = total;
        }

        gameUpdates[i].team = el.team;
        gameUpdates[i].status = el.status;
        i += 1;
    });

    return gameUpdates;
}

function getLatestGame (req, res) {
    queryLatestGame(function (gameArr) {
        if (gameArr) {
            res.json(formatGameUpdates(gameArr));
        } else {
            res.json([{results: 0}])
        }
    });
}

function getGetFinalsTeam (req, res) {

    var Schedule = scheduleSchema.Schedule;

    Schedule.distinct('team', { year: getYear()}, function (err, sDoc) {
        if (!err) {
            getTeam({first_name: {$in: [sDoc[0], sDoc[1]]}}, function (tDoc) {
                if (tDoc.length) {
                    res.json({
                        team1_name: tDoc[0].first_name,
                        team1_alias: tDoc[0].last_name,
                        team2_name: tDoc[1].first_name,
                        team2_alias: tDoc[1].last_name
                    });
                } else {
                    res.json({});
                }
            });
        } else {
            res.json({});
        }
    });
}

function getYear () {
    return new Date().getFullYear();
}

function daysName () {
    return ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
}

function monthsName () {
    return ['Junuary', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
}

// EXPORT

module.exports = {
    getLatestGame: getLatestGame,
    getGetFinalsTeam: getGetFinalsTeam,
    getTeamsFromApi: getTeamsFromApi,
    getYear: getYear,
    daysName: daysName,
    monthsName: monthsName
}