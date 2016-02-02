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
    'leaflet-directive'
])
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
    .otherwise({
        redirectTo: '/'
    });
});

