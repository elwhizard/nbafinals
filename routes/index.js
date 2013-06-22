
/*
 * GET home page.
 */
var nbaFinals = require('../lib/nbaFinalsLib');

exports.index = function (req, res) {
	res.render("index", {
		"title": 'NBA Finals',
		"year": nbaFinals.getYear()
	});
};