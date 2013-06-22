define([
    'underscore',
    'backbone'
], function(_, Backbone) {
    var GameModel = Backbone.Model.extend({
        url: '/ajax/game'
    });
    return GameModel;
});
