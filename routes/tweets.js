var express = require('express'),
    twit = require('twit');


exports.streamTweets = function (callback) {

    var watchList = ['nbafinals', 'spurs', 'heat'];

    var T = new twit({
        consumer_key: '9EGTOp2tNEEzl54plhntw',
        consumer_secret: 'wlU7D1qZAexjMmamDkQ0nuMIDPuej2CLvUdWf8PKC8',
        access_token: '48005190-YA2qyxcYi0hpXPYAP6SCNhbQkEUX7fkCxm423VoyB',
        access_token_secret: 'HXzpWxhbN1jsq3NFNQCJc5ltUXfqEvJe7EpT7ES8'
    });

    var stream = T.stream('statuses/filter', { track: watchList });
    stream.on('tweet', function (tweet) {
        callback(tweet);
    });
}

exports.getRecentTweets = function (req, res) {
    var T = new twit({
        consumer_key: '9EGTOp2tNEEzl54plhntw',
        consumer_secret: 'wlU7D1qZAexjMmamDkQ0nuMIDPuej2CLvUdWf8PKC8',
        access_token: '48005190-YA2qyxcYi0hpXPYAP6SCNhbQkEUX7fkCxm423VoyB',
        access_token_secret: 'HXzpWxhbN1jsq3NFNQCJc5ltUXfqEvJe7EpT7ES8'
    });

    T.get('search/tweets', { q: 'nbafinals OR miami heat OR spurs', count: 5 }, function(err, reply) {
        if (!err) {
            res.json(reply.statuses)
        } else {
            res.json({results: 0});
        }
    });
}
