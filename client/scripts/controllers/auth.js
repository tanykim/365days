'use strict';

angular.module('365daysApp')
    .controller('AuthCtrl', ['$scope', '$interval', '$location', 'socket', '$cookies', 'moment',
    function ($scope, $interval, $location, socket, $cookies, moment) {

        console.log('authentication page - code:', $location.search().code);
        console.log($cookies.getAll());

        $scope.status = 'Requesting authorization...';
        $scope.error = false;

        //already authorized, go to next view
        if ($cookies.get('token') && $cookies.get('firstDate')) {
            $scope.status = 'Already authorized';
            $interval(function () {
                $location.path('/year').search({});
            }, 1000);
            return false;
        } else {
            var code = $location.search().code;
            console.log('code---', code);
            if (code) {
                socket.emit('code', { code: code });
            }
        }

        socket.on('token', function () {
            $scope.status = 'Access granted, requesting profile...';
        });
        socket.on('profile', function (d) {
            $scope.status = 'Successfully acquired your profile info';
            $cookies.put('token', d.token);
            $cookies.put('firstDate', d.profile.profile.firstDate);
            $location.path('/year').search({});
        });
        socket.on('error', function (d) {
            console.log(d.error);
            $scope.error = true;
            $scope.status = 'Error occured, please try later.';
        });

        $scope.goMain = function () {
            $location.path('/');
        };
}]);
