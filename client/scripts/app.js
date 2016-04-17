'use strict';

/**
* @ngdoc overview
* @name 365daysApp
* @description
* # 365daysApp
*
* Main module of the application.
*/
angular
.module('365daysApp', [
    'ngAnimate',
    'ngRoute',
    'ngCookies',
    'btford.socket-io',
    'ui.bootstrap',
    'underscore',
    'angularMoment',
    'leaflet-directive',
    'color.picker',
    'd3',
    'textures'
])
.config(['$logProvider', function ($logProvider){
    //leaflet map debug hide
    $logProvider.debugEnabled(false);
}])
.config(function ($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
    })
    .when('/authentication', {
        templateUrl: 'views/auth.html',
        controller: 'AuthCtrl',
        controllerAs: 'auth'
    })
    .when('/year', {
        templateUrl: 'views/year.html',
        controller: 'YearCtrl',
        controllerAs: 'year'
    })
    .when('/places', {
        templateUrl: 'views/places.html',
        controller: 'PlacesCtrl',
        controllerAs: 'places'
    })
    .when('/trips', {
        templateUrl: 'views/trips.html',
        controller: 'TripsCtrl',
        controllerAs: 'trips'
    })
    .when('/canvas', {
        templateUrl: 'views/canvas.html',
        controller: 'CanvasCtrl',
        controllerAs: 'canvas'
    })
    .when('/vis', {
        templateUrl: 'views/vis.html',
        controller: 'VisCtrl',
        controllerAs: 'vis'
    })
    .otherwise({
        redirectTo: '/'
    });
});


