require.config({
    baseUrl: '/js',
    paths: {
        // Major libraries
        jquery: '/js/libs/jquery/jquery-min',
        underscore: '/js/libs/underscore/underscore', // https://github.com/amdjs
        backbone: '/js/libs/backbone/backbone', // https://github.com/amdjs
        backgrid: '/js/libs/backgrid/lib/backgrid',
        socketio: '/socket.io/socket.io',

        // Require.js plugins
        text: '/js/libs/require/text',

        // Just a short cut so we can put our html outside the js dir
        // When you have HTML/CSS designers this aids in keeping them out of the js directory
//        templates: '../templates',

        config: 'config'
    },
    map: {
        '*': {
            'css': '/js/libs/require/plugins/requirecss/css.js'
        }
    },
    shim: {
        backbone : {
            deps : [ 'underscore', 'jquery' ],
            exports : 'Backbone'
        },
        backgrid: {
            deps: ['jquery', 'backbone', 'underscore', 'css!libs/backgrid/lib/backgrid'],
            exports: 'Backgrid'
        },
        underscore: {
            exports: '_'
        },
        socketio: {
            exports: 'io'
        }
    }

});

// Let's kick off the application

require([
    'jquery',
    'underscore',
    'backbone',
    'backgrid',
    '/js/router/Main.js',
    '/js/collections/Games.js',
    '/js/collections/Schedules.js'
], function($, _, Backbone, Backgrid, MainRouter, GameCollections, SchedulesCollections){

    var Territory = Backbone.Model.extend({});

    var Territories = Backbone.Collection.extend({
        model: Territory,
        url: "examples/territories.json"
    });

    var territories = new Territories();

    var gameCols = new GameCollections();
    var schedulesCols = new SchedulesCollections();


    var gamesColumns = [{
        name: "team",
        label: "Team",
        editable: false,
        // The cell type can be a reference of a Backgrid.Cell subclass, any Backgrid.Cell subclass instances like *id* above, or a string
        cell: "string",
        width: 'auto' // This is converted to "StringCell" and a corresponding class in the Backgrid package namespace is looked up
    }, {
        name: "q1",
        label: "1",
        editable: false,
        cell: "integer"
    }, {
        name: "q2",
        label: "2",
        editable: false,
        cell: "integer"
    }, {
        name: "q3",
        label: "3",
        editable: false,
        cell: "integer"
    }, {
        name: "q4",
        label: "4",
        editable: false,
        cell: "integer"
    }, {
        name: "total",
        label: "T",
        editable: false,
        cell: "integer"
    }];


    // Initialize a new Grid instance
    var currentGameGrid = new Backgrid.Grid({
        columns: gamesColumns,
        collection: gameCols
    });

    $('#currentGameGrid').append(currentGameGrid.render().$el);



    var schedulesColumns = [{
        name: "datePretty",
        label: "Date",
        editable: false,
        cell: 'string'
    }, {
        name: "hour",
        label: "Time",
        editable: false,
        cell: "string"
    }, {
        name: "site",
        label: "Site",
        editable: false,
        cell: "string"
    }, {
        name: "score",
        label: "Score",
        editable: false,
        cell: "string"
    }, {
        name: "seriesStanding",
        label: "Series",
        editable: false,
        cell: "string"
    }];

    // Initialize a new Grid instance
    var gameSchedulesGrid = new Backgrid.Grid({
        columns: schedulesColumns,
        collection: schedulesCols
    });

    $('#gameSchedulesGrid').append(gameSchedulesGrid.render().$el);

    // Games collection
    function gameFetch () {
        gameCols.fetch({
            success: function (col, res, opt) {
                // If we're on the final game
                // Stop polling the server
                if (col.at(1).get('status') === 'Final') {
                    clearInterval(gameFetchInterval);
                }
            },
            error: function (col, res, opt) {
            }
        });
    }

    var gameFetchInterval;


    // Schedules collection
    function schedFetch () {
        schedulesCols.fetch({
            remove: true,
            success: function (col, res, opt) {
                // If we're getting data then clear our fetch inteval
                if (col.length > 1) {
                    clearInterval(schedInterval);
                    // We're now going to fetch game data
                    gameFetch();
                    // Poll server every 5 seconds until we get the schedules
                    gameFetchInterval = setInterval(gameFetch, 5000);
                }
            },
            error: function (col, res, opt) {

            }
        });
    }

    schedFetch();
    // Poll server every 5 seconds until we get the schedules
    var schedInterval = setInterval(schedFetch, 5000);

    var tweetTemplate = _.template($('#tweetTemplate').html());

    function ajaxTweetsReq () {
        $.ajax({
            url: '/ajax/tweets'
        }).done(function ( tweets ) {
            $('ul.tweets').fadeOut('fast', function () {
                $(this).html('');

                tweets.forEach(function (tweet) {
                    $(tweetTemplate({
                        text: tweet.text,
                        screen_name: tweet.user.screen_name,
                        imageUrl: tweet.user.profile_image_url
                    })).appendTo($('ul.tweets'));
                });
                $(this).fadeIn();
            });
        });
    }

    ajaxTweetsReq();

    setInterval(ajaxTweetsReq, 30000);

    var newsTemplate = _.template($('#newsTemplate').html());

    function ajaxNewsReq () {
        $.ajax({
            url: '/ajax/news'
        }).done(function ( news ) {
            if (news.results !== 0) {
                $('ul.news').fadeOut('fast', function () {
                    $(this).html('');

                    news.forEach(function (newsItem) {
                        $(newsTemplate({
                            headline: newsItem.headline,
                            url: newsItem.url,
                            source: newsItem.source
                        })).appendTo($('ul.news'));
                    });
                    $(this).fadeIn();
                });
                // Clear the 30 seconds news query
                clearInterval(newsInterval);
            }
        });
    }

    ajaxNewsReq();
    // Get news every 30 seconds until we get news items
    var newsInterval = setInterval(ajaxNewsReq, 30000);


    // Get Finals Team
    var finalsTeamTemplate = _.template($('#finalsTeamTemplate').html());

    function ajaxFinalsTeamReq () {
        $.ajax({
            url: '/ajax/finalsTeam'
        }).done(function ( finalsTeam ) {
                if (finalsTeam.team1_name) {
                    $('.teamStanding').fadeOut('fast', function () {
                        $(this).html('');
                        $(finalsTeamTemplate(finalsTeam)).appendTo($('.teamStanding'));
                        $(this).fadeIn();
                    });
                    // Clear the 30 seconds news query
                    clearInterval(finalsTeamInterval);
                }
            });
    }

    ajaxFinalsTeamReq();
    // Get news every 5 seconds until we get news items
    var finalsTeamInterval = setInterval(ajaxFinalsTeamReq, 5000);

});
