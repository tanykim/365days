'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('CanvasCtrl', [
    '$scope', '$location', '_', 'analyzer', 'visualizer',
    function ($scope, $location, _, analyzer, visualizer) {

        if (!analyzer.hasPlacesData()) {
            $location.path('/year');
            return false;
        }

        //get vis canvas selectinon
        $scope.options = visualizer.getCanvasSettings();

        //provided options for style
        $scope.size = { //A0, A1
            portrait: ['84.1 x 118.9cm (33.11 x 46.81 inches)', '59.4 x 84.1cm (23.39 x 33.11 inches)'],
            landscape: ['118.9 x 84.1cm (46.81 x 33.11 inches)', '84.1 x 59.4cm (33.11 x 23.39 inches)']
        };

        //edit from HTML
        var places = analyzer.getDatasetForVis().places;
        $scope.$watch('options', function () {
            visualizer.setCanvas($scope.options, places);
        }, true);
    }
]);