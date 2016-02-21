'use strict';

/* select year, then select and customize places to visualize */

angular.module('365daysApp').controller('VisCtrl', [
    '$scope', '$location', '_', 'textures', 'analyzer', 'visualizer',
    function ($scope, $location, _, textures, analyzer, visualizer) {

        if (!analyzer.hasPlacesData()) {
            $location.path('/year');
            return false;
        }

        //get dataset for vis
        var dataset = analyzer.getDatasetForVis();
        $scope.places = dataset.places;

        //set colors and textures for vis
        var colors = {
            home: ['#db59a0', '#eb7e58', '#eb535a', '#ebcd53'], //warm color
            work: ['#4fa6ce', '#5dd5ba', '#527cb0', '#96d070'], //cold color
            //others: ['#666666', '#8c8c8c', '#b3b3b3', '#d9d9d9'] //grey HSB B- 40, 55, 70, 85%
            others: ['#8c8c8c', '#8c8c8c', '#8c8c8c', '#8c8c8c'] //grey HSB B- 40, 55, 70, 85%
        };
        $scope.colors = _.object(_.map(dataset.places, function (list, type) {
            var c = _.map(_.range(list.length), function (i) {
                return colors[type][i % colors[type].length];
            });
            return [type, c];
        }));

        //for texture options in the edit panel
        var textureOptions = [
            {}, //no texture, solid color
            textures.lines().size(8),
            textures.circles().size(8),
            textures.lines().size(4),
            textures.circles().size(4)
        ];
        //index of selected texture options
        var txt = {
            home: [1],
            work: [0],
            others: [1, 2, 3, 4]
        };
        $scope.textures = _.object(_.map(dataset.places, function (list, type) {
            var t = _.map(_.range(list.length), function (i) {
                return txt[type][i % txt[type].length];
            });
            return [type, t];
        }));
        $scope.textOptionsCount = function () {
            return _.range(textureOptions.length);
        };

        $scope.drawColorTextureChip = function (wrapper, index) {

            var texture = angular.copy(textureOptions[index]);

            var color = 'rgba(0, 0, 0, 0)';
            if (index === 0) {
                texture.url = function () { return color; };
            } else {
                texture.background(color);
                wrapper.call(texture);
            }
            wrapper.append('rect')
                .attr('width', 100)
                .attr('height', 20)
                .style('fill', texture.url());
        };

        //color/texture change
        $scope.isEditCollapsed = true;
        $scope.updateTextureSelection = function (type, placeIndex, textureIndex) {
            $scope.textures[type][placeIndex] = textureIndex;
        };
        $scope.updatePainting = function (type, index, color, textureIndex) {
            var newFill = {};
            if (textureIndex === 0) {
                newFill = {
                    url: function () { return color; },
                    isSolid: true
                };
            } else {
                // default texture library setting dupicates ids regardless colors
                //thus, set the id manually with color + texture id combination
                newFill = textureOptions[textureIndex].background(color)
                    .id(color.substr(1, 6) + textureIndex);
            }
            visualizer.updatePainting(type, index, newFill);
        };

        //draw vis
        visualizer.drawCanvas();
        visualizer.drawVis(dataset);
    }
])
.directive('colorChip', ['d3', function (d3) {
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
                //apply color and pattern to the color chip
                var svg = d3.select(elem[0]).select('svg');
                svg.selectAll('*').remove();
                scope.$parent.drawColorTextureChip(svg, newVals[1]);
                scope.$parent.updatePainting(scope.type, scope.index, newVals[0], newVals[1]);
            });
        }
    };
}])
.directive('textureList', ['d3', function (d3) {
    return {
        restrict: 'EA',
        scope: {
            index: '@',
            type: '@'
        },
        link: function (scope, elem) {
            scope.$parent.drawColorTextureChip(d3.select(elem[0]).select('svg'), +scope.index);
        }
    };
}]);