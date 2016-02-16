'use strict';

/**
 * @ngdoc function
 * @name 365daysApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the 365daysApp
 */
angular.module('365daysApp')
    .controller('MainCtrl', ['$scope', '$location', '$window', 'socket', '$cookies',
    function ($scope, $location, $window, socket, $cookies) {

        console.log('cookies---', $cookies.getAll());

        $scope.hasCookies = ($cookies.get('token') && $cookies.get('firstDate')) ? true : false;
        console.log($scope.hasCookies);
        $scope.authenticateMoves = function () {
            socket.emit('authenticate');
            socket.on('url', function (d) {
                $window.location = d.url;
            });
        };
}]);
