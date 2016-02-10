'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('VisCtrl', [
    '$scope', '$location', '_', 'analyzer', 'visualizer',
    function ($scope, $location, _, analyzer, visualizer) {

        //TODO: make previous step done check as function
        //check data created
        if (!analyzer.isAlreadySetup()) {
            $location.path('/setup');
            return false;
        }

        //get dataset for vis
        var dataset = analyzer.getDatasetForVis();

        //set colors for vis
        var colors = {
            home: ['#db59a0', '#eb7e58', '#eb535a', '#ebcd53'], //warm color
            work: ['#4fa6ce', '#5dd5ba', '#527cb0', '#96d070'], //cold color
            others: ['#666666', '#8c8c8c', '#b3b3b3', '#d9d9d9'] //grey HSB B- 40, 55, 70, 85%
        };
        $scope.colors = _.object(_.map(dataset.places, function (list, type) {
            var c = _.map(_.range(list.length), function (i) {
                return colors[type][i % colors[type].length];
            });
            return [type, c];
        }));
        var oldColors = angular.copy($scope.colors);
        $scope.places = dataset.places;
        visualizer.drawVis(dataset, $scope.colors);

        //color change
        $scope.isEditCollapsed = true;
        $scope.$watch('colors', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                _.each(oldColors, function (list, type) {
                    //find the changed color and update the vis
                    var oldColor = _.difference(list, newVal[type])[0];
                    var newColor = _.difference(newVal[type], list)[0];
                    if (!_.isUndefined(oldColor) && !_.isUndefined(newColor)) {
                        var changeIndex = _.indexOf(list, oldColor);
                        visualizer.updateColor(type, changeIndex, newColor);
                        //update old color with new one
                        oldColors[type] = angular.copy(newVal[type]);
                    }
                });
            }
        }, true);
    }
]);