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
    'ui.bootstrap',
    'underscore',
    'angularMoment',
    'leaflet-directive',
    'color.picker',
    'd3'
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
    .when('/setup', {
        templateUrl: 'views/setup.html',
        controller: 'SetupCtrl',
        controllerAs: 'setup'
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

