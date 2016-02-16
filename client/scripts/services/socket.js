'use strict';

angular.module('365daysApp').factory('socket', ['socketFactory',
    function (socketFactory) {
        return socketFactory();
    }
]);