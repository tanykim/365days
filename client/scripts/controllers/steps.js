'use strict';

angular.module('365daysApp')
    .controller('StepsCtrl', ['_', '$cookies', '$location', '$scope', 'analyzer',
    function (_, $cookies, $location, $scope, analyzer) {

        $scope.steps = ['year', 'places', 'trips', 'canvas', 'vis'];
        $scope.currentStep = _.indexOf($scope.steps, $location.path().substr(1)) + 1;

        $scope.logout = function () {
            _.each($cookies.getAll(), function (val, key) {
                $cookies.remove(key);
            });
            console.log('cookies---', $cookies.getAll());
            $location.path('/');
        };

        $scope.goPrev = function () {
            var step = $scope.steps[$scope.currentStep - 1];
            //if going back to Places
            if (step === 'canvas') {
                analyzer.resetAllPlaces();
                analyzer.resetAllSelectedPlaces();
            }
            $location.path('/' + $scope.steps[$scope.currentStep - 2]);
        };
}]);
