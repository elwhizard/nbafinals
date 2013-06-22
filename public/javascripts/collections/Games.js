define([
    'jquery',
    'underscore',
    'backbone',
    '/js/models/Game.js'
], function($, _, Backbone, GameModel){

    var GamesCollection = Backbone.Collection.extend({
        model: GameModel,
        url: '/ajax/latestGame'
    });

    return GamesCollection;
});
