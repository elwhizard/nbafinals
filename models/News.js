
var db = require('../lib/db'),
    mongoose = require('mongoose');;

var NewsSchema = new mongoose.Schema({
    headline: String,
    url: String,
    published: Number,
    source: String,
    newsMeta: Boolean,
    lastInsertTime: Number
});

var News = mongoose.model('News', NewsSchema);

function addNews(values) {
    var doc = new News();
    // Ensures that we'll have unique items
    values.forEach(function (newsItem) {
        News.collection.update(
        {
            published: newsItem.published,
            source: newsItem.source
        },
        { $set: {
            headline: newsItem.headline,
            url: newsItem.url,
            published: newsItem.published,
            source: newsItem.source
        }},
        {
            upsert: true
        }, function (err, numberAffected, raw) {
            console.log('The number of updated documents was %d', numberAffected);
            console.log('The raw response from Mongo was ', raw);
        });
    });
    updateNewsInsertTime();
}

function updateNewsInsertTime () {
    News.collection.update(
    { newsMeta: true },
    { $set: {
        newsMeta: true,
        lastInsertTime: Date.now()
    }},
    {
        upsert: true
    }, function (err, numberAffected, raw) {
        console.log('The number of updated documents was %d', numberAffected);
        console.log('The raw response from Mongo was ', raw);
    });
}

function getLastInsertTime (callback) {
    News.findOne({newsMeta: true}, callback);
}

module.exports.News = News;
module.exports.addNews = addNews;
module.exports.getLastInsertTime = getLastInsertTime;