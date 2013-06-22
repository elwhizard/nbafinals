define([
    'underscore',
    'backbone'
], function(_, Backbone) {
    console.log(arguments)
    console.log(Backbone)
    var ScheduleModel = Backbone.Model.extend({
        url: '/ajax/schedules'
    });
    return ScheduleModel;
});
