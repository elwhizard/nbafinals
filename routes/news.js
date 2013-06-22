var http = require('http'),
    newsSchema = require('../models/News');


function getNewsFromApi () {
    // Getting news from NBC
    var options = {
        hostname: 'api.msnbc.msn.com',
        port: 80,
        path: '/documents/getdocuments?entities=nba&contentType=ar&maxResults=3&siteId=3',
        method: 'GET'
    };

    var req = http.request(options, function(res) {
        var body = '';

        res.on("data", function(chunk){
            body += chunk.toString('utf8');
        });

        res.on("end", function(){
            if (body.search(/DOCTYPE html PUBLIC/gmi) === -1) {
                body = body.replace(/\\"/gmi, '"');
                body = body.replace(/NaN/gmi, '""');
                formatNews('nbc', body);
            } else {
                formatNews(false);
            }
        });
    });
    req.end();

    // ESPN news source
    var options = {
        hostname: 'api.espn.com',
        port: 80,
        path: '/v1/sports/basketball/nba/news/headlines?apikey=9bvp65x8ezccctagvxwjgg8a',
        method: 'GET'
    };

    var req = http.request(options, function(res) {
        var body = '';

        res.on("data", function(chunk){
            body += chunk.toString('utf8');
        });

        res.on("end", function(){
            body = JSON.parse(body);
            if (body.headlines) {
                formatNews('espn', body);
            } else {
                formatNews(false);
            }
        });
    });
    req.end();

}

function formatNews (res, body) {

    var newsItems, newsItemsArr = [];

    if (res) {
        switch (res) {
            case 'nbc':
                newsItems = body.Documents;

                newsItems.forEach(function (item) {
                    var newsDateMs = item.DocPublished.match(/\d+/g)[0];
                    newsDateMs = parseInt(newsDateMs, 10);

                    newsItemsArr.push({
                        headline: item.DocTitle,
                        url: item.DocUri,
                        source: 'NBC Sports',
                        published: newsDateMs
                    });
                });
                break;
            case 'espn':
                newsItems = body.headlines;
                newsItems.forEach(function (item) {
                    var newsDateMs = new Date(item.published).getTime();
                    newsItemsArr.push({
                        headline: item.headline,
                        url: item.links.web.href,
                        source: 'ESPN',
                        published: newsDateMs
                    });
                });
                break;
        }
        addNewsItemsToCol(newsItemsArr);
    }

}

function addNewsItemsToCol (newsItemsArr) {
    newsSchema.addNews(newsItemsArr);
}

exports.getRecentNews = function (req, res) {
    var News = newsSchema.News;
    newsSchema.getLastInsertTime(function (err, lastNewsInsert) {
        if (!err) {
            if (!lastNewsInsert) {
                // No news
                // Get from our news provider
                getNewsFromApi();
                res.json({results: 0});

            } else if (Date.now() > lastNewsInsert.lastInsertTime + 7200000) {
                // we need to update our news items if it's beyond 2 hours
                getNewsFromApi();
            }

            // Get news from our collections
            var qs = News.find().sort({published: -1}).limit(10);

            qs.execFind(function (err, doc) {
                if (!err) {
                    res.json(doc);
                } else {
                    res.json({results: 'asdfasd'});
                }
            });
        } else {
            res.json({results: 'asdfasd'});
        }

    });

}




