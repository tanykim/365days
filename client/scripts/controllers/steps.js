'use strict';

angular.module('365daysApp')
    .controller('StepsCtrl', ['_', '$cookies', '$location', '$scope',
    function (_, $cookies, $location, $scope) {

        $scope.steps = ['year', 'places', 'canvas', 'vis'];
        $scope.currentStep = _.indexOf($scope.steps, $location.path().substr(1)) + 1;
        $scope.logout = function () {
            _.each($cookies.getAll(), function (val, key) {
                $cookies.remove(key);
            });
            console.log('cookies---', $cookies.getAll());
        };
}]);
