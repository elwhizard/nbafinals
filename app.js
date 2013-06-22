/**
 * Author: Elluis L. Invento
 * elwhizard@gmail.com
 * javascriptcebu.com
 */

/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
    schedule = require('./routes/schedule'),
    tweets = require('./routes/tweets'),
    news = require('./routes/news'),
	http = require('http'),
	path = require('path'),
	nbaFinals = require('./lib/nbaFinalsLib');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

app.use('/img',express.static(path.join(__dirname, 'public/images')));
app.use('/js',express.static(path.join(__dirname, 'public/javascripts')));
app.use('/css',express.static(path.join(__dirname, 'public/stylesheets')));


// Ajax requests
app.get('/ajax/:collections', function (req, res) {
    var collection = req.params.collections;

    switch(collection) {
        case 'finalsTeam':
            nbaFinals.getGetFinalsTeam(req, res);
            break;
        case 'latestGame':
            nbaFinals.getLatestGame(req, res);
            break;
        case 'schedules':
            schedule.getSchedules(req, res);
            break;
        case 'tweets':
            tweets.getRecentTweets(req, res);
            break;
        case 'news':
            news.getRecentNews(req, res);
            break;
        default:
            res.send('invalid request');
    }

});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
