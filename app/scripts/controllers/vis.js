'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('VisCtrl', [
    '$scope', '$location', '_', 'analyzer', 'visualizer',
    function ($scope, $location, _, analyzer, visualizer) {

        //check data created
        if (!analyzer.isAlreadySetup()) {
            $location.path('/setup');
            return false;
        }

        //get places to visualize
        $scope.places = analyzer.getSelectedPlaces();
        console.log($scope.places);

        //vis style selection
        $scope.options = {
            orientation: 'portrait',
            size: 0,
            //get colors from place info
            colors: _.object(_.map($scope.places, function (d, key) {
                return [key, _.pluck(d, 'color')];
            }))
        };

        //provided options for style
        $scope.size = { //A0, A1
            portrait: ['84.1 x 118.9cm (33.11 x 46.81 inches)', '59.4 x 84.1cm (23.39 x 33.11 inches)'],
            landscape: ['118.9 x 84.1cm (46.81 x 33.11 inches)', '84.1 x 59.4cm (33.11 x 23.39 inches)']
        };

        //color change
        $scope.isEditCollapsed = true;

        //edit from HTML
        //watch vis options changes
        $scope.$watch('options', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                $scope.edited = true;
            }
        }, true);
        $scope.$watch('options.colors', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                //update colors of place
                _.each($scope.places, function (list, key) {
                    _.each(list, function (d, i) {
                        d.color = $scope.options.colors[key][i];
                    });
                });
            }
        }, true);

        $scope.completeEdit = function () {
            visualizer.editVis();
            $scope.edited = false;
        };

        visualizer.drawVis();
    }
]);