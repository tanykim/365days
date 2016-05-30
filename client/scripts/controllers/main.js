'use strict';

/**
 * @ngdoc function
 * @name 365daysApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the 365daysApp
 */
angular.module('365daysApp').controller('MainCtrl', [
    '$scope', '$location', '$window', 'socket', '$cookies', 'cookieManager',
    function ($scope, $location, $window, socket, $cookies, cookieManager) {

        console.log('main page cookies---', $cookies.getAll());

        $scope.hasValidToken = false;
        $scope.hasFirstDateCookie = false;
        $scope.hasValidCookies = false;

        function updateTokenStatus(status) {
            $scope.hasValidToken = status;
            $scope.checkingValidCookies = false;
        }

        if ($cookies.get('token')) {
            $scope.checkingValidCookies = true;
            cookieManager.checkTokenValidity(updateTokenStatus);
            $scope.hasFirstDateCookie = $cookies.get('firstDate');
        }

        $scope.$watchGroup(['hasValidToken', 'hasFirstDateCookie'], function (newVal, oldVal) {
            if (newVal[0] && newVal[1]) {
                $scope.hasValidCookies = true;
            }
        });

        $scope.authenticateMoves = function () {
            socket.emit('authenticate');
            socket.on('url', function (d) {
                $window.location = d.url;
            });
        };
}]);
