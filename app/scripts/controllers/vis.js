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

        //set colors and textures for vis
        var colors = {
            home: ['#db59a0', '#eb7e58', '#eb535a', '#ebcd53'], //warm color
            work: ['#4fa6ce', '#5dd5ba', '#527cb0', '#96d070'], //cold color
            //others: ['#666666', '#8c8c8c', '#b3b3b3', '#d9d9d9'] //grey HSB B- 40, 55, 70, 85%
            others: ['#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c'] //grey HSB B- 40, 55, 70, 85%
        };
        var textures = {
            home: [ { type: 'none' } ],
            work: [ { type: 'none' } ],
            others: [ { type: 'line', size: '4'},
                { type: 'line', size: '8'},
                { type: 'circles', size: '4'},
                { type: 'circles', size: '2'}
            ]
        };
        var styles = _.map([colors, textures], function (style) {
            var result = _.object(_.map(dataset.places, function (list, type) {
                var t = _.map(_.range(list.length), function (i) {
                    return style[type][i % style[type].length];
                });
                return [type, t];
            }));
            return result;
        });
        $scope.colors = styles[0];
        $scope.textures = styles[1];

        //places for editing directives
        $scope.places = dataset.places;

        //draw vis
        visualizer.drawCanvas();
        visualizer.drawVis(dataset, $scope.colors);

        //color change
        $scope.isEditCollapsed = true;
    }
])
.directive('colorChip', ['d3', 'visualizer', function (d3, visualizer) {
    console.log('----');
    return {
        restrict: 'E',
        scope: {
            color: '=',
            texture: '=',
            type: '@',
            index: '@'
        },
        link: function (scope, elem) {
            scope.$watchGroup(['color', 'texture'], function (newVals) {
                //draw pattern and apply to color chip
                var svg = d3.select(elem[0]).select('svg');
                visualizer.drawColorTextureChip(svg, newVals[0], newVals[1]);
                visualizer.updateColor(scope.type, scope.index, newVals[0]);
            });
        }
    };
}]);