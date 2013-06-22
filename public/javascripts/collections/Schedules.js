define([
    'jquery',
    'underscore',
    'backbone',
    '/js/models/Schedule.js'
], function($, _, Backbone, GameModel){
    var SchedulesCollection = Backbone.Collection.extend({
        model: GameModel,
        url: '/ajax/schedules'
    });

    return SchedulesCollection;
});
