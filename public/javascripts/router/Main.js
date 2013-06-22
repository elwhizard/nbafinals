define([
    'jquery',
    'underscore',
    'backbone',
    '/js/views/Main.js'
], function ($, _, Backbone, MainView) {
    console.log('main router');
    var MainRouter = Backbone.Router.extend({
        routes: {
            '*actions': 'defaultAction'
        }
    });

    var initialize = function(){

        //var vent = _.extend({}, Backbone.Events);
        var router = new MainRouter();

        console.log("MainRouter / initialize");

        router.on('route:defaultAction', function (actions) {

            var mainView = new MainView();
            mainView.render();
            console.log("default route");

        });

        Backbone.history.start();

    };
    return {
        initialize: initialize
    };
});
