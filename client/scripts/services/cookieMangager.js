'use strict';

angular.module('365daysApp').service('cookieManager', [
    '$cookies', '$window', 'socket',
    function ($cookies, $window, socket) {

        this.isTokenValid = false;
        var that = this;

        this.checkTokenValidity = function (callback) {
            console.log('---checking token validity');
            socket.emit('checkToken', { access_token: $cookies.get('token') });
            socket.on('tokenStatus', function (d) {
                console.log('token status---', d);
                if (_.indexOf(_.keys(d), 'error') === -1) {
                    that.isTokenValid = true;
                } else {
                    that.isTokenValid = false;
                }
                callback(that.isTokenValid);
            });
        };

        // this.checkTokenStatusAtSteps = function () {
        //     console.log(that.isTokenValid);
        //     if (that.isTokenValid) {
        //         console.log('valid token!');
        //         return true;
        //     } else {
        //         console.log('no valid token!');
        //         $window.location = '/';
        //         return false;
        //     }
        // };

        return this;
    }
]);